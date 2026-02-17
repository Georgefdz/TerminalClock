import React, { useEffect, useState } from "react";
import { render, Box, Text, useStdout, useInput, useApp } from "ink";
import figlet from "figlet";

const FONTS = ["Big", "Standard", "Banner", "Slant", "Small"];

const WMO_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ slight hail",
  99: "Thunderstorm w/ heavy hail",
};

const padSingleNum = (n) => String(n).padStart(2, "0");

const formatTime = (date, use12h) => {
  let hours = date.getHours();
  const suffix = use12h ? (hours >= 12 ? " PM" : " AM") : "";
  if (use12h) {
    hours = hours % 12 || 12;
  }
  return `${padSingleNum(hours)}:${padSingleNum(date.getMinutes())}:${padSingleNum(date.getSeconds())}${suffix}`;
};

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createAsciiText = (text, options = {}) =>
  new Promise((resolve, reject) => {
    figlet(text, options, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const fetchWeather = async () => {
  try {
    const geoRes = await fetch("http://ip-api.com/json/");
    if (!geoRes.ok) return null;
    const geo = await geoRes.json();

    const { lat, lon, city } = geo;
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
    );
    if (!weatherRes.ok) return null;
    const weatherData = await weatherRes.json();

    const cw = weatherData.current_weather;
    return {
      city,
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      condition: WMO_CODES[cw.weathercode] ?? "Unknown",
    };
  } catch {
    return null;
  }
};

function AsciiClock() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [now, setNow] = useState(new Date());
  const [asciiArt, setAsciiArt] = useState("");
  const [hue, setHue] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [use12h, setUse12h] = useState(false);
  const [weather, setWeather] = useState(null);
  const [useFahrenheit, setUseFahrenheit] = useState(false);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    }
    if (input === "f") {
      setUse12h((prev) => !prev);
    }
    if (input === "a") {
      setFontIndex((prev) => (prev + 1) % FONTS.length);
    }
    if (input === "d") {
      setFontIndex((prev) => (prev - 1 + FONTS.length) % FONTS.length);
    }
    if (input === "w") {
      setUseFahrenheit((prev) => !prev);
    }
  });

  const [dimensions, setDimensions] = useState({
    cols: stdout.columns ?? 80,
    rows: stdout.rows ?? 24,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 250);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hueTimer = setInterval(() => {
      setHue((prev) => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(hueTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await fetchWeather();
      if (!cancelled) setWeather(data);
    };

    load();
    const interval = setInterval(load, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        cols: stdout.columns ?? 80,
        rows: stdout.rows ?? 24,
      });
    };

    stdout.on("resize", handleResize);
    return () => stdout.off("resize", handleResize);
  }, [stdout]);

  useEffect(() => {
    const timeString = formatTime(now, use12h);
    let cancelled = false;

    createAsciiText(timeString, { font: FONTS[fontIndex] })
      .then((banner) => {
        if (!cancelled) {
          setAsciiArt(banner.trimEnd());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAsciiArt(timeString);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [now.getHours(), now.getMinutes(), now.getSeconds(), fontIndex, use12h]);

  const lines = asciiArt.split("\n");
  const bannerHeight = lines.length;
  const bannerWidth = Math.max(...lines.map((line) => line.length), 0);

  const color = hslToHex(hue, 80, 55);
  const dateString = formatDate(now);
  const fontName = FONTS[fontIndex];
  const helpText = `q/Esc: quit  f: ${use12h ? "24h" : "12h"}  a/d: font (${fontName})  w: °${useFahrenheit ? "C" : "F"}`;

  const displayTemp = (tempC) => {
    if (useFahrenheit) {
      return `${((tempC * 9) / 5 + 32).toFixed(1)}°F`;
    }
    return `${tempC.toFixed(1)}°C`;
  };

  const innerCols = dimensions.cols - 4;
  const innerRows = dimensions.rows - 2;
  const clockBlockHeight = bannerHeight + (weather ? 3 : 2);
  const innerTopPadding = Math.max(
    0,
    Math.floor((innerRows - clockBlockHeight - 1) / 2),
  );
  const innerLeftPadding = Math.max(
    0,
    Math.floor((innerCols - bannerWidth) / 2),
  );
  const datePadding = Math.max(
    0,
    Math.floor((innerCols - dateString.length) / 2),
  );

  return (
    <Box
      flexDirection="column"
      width={dimensions.cols}
      height={dimensions.rows}
      borderStyle="round"
      borderColor={color}
    >
      <Box height={innerTopPadding} />

      <Box flexDirection="column" paddingLeft={innerLeftPadding}>
        {lines.map((line, index) => (
          <Text key={index} color={color}>
            {line}
          </Text>
        ))}
      </Box>

      <Box paddingLeft={datePadding}>
        <Text dimColor>{dateString}</Text>
      </Box>

      {weather && (
        <Box justifyContent="center">
          <Text dimColor>
            <Text color={color}>{weather.city}</Text>
            {" — "}
            {displayTemp(weather.temperature)}
            {" — "}
            {weather.condition}
            {" — Wind "}
            {weather.windspeed} km/h
          </Text>
        </Box>
      )}

      <Box flexGrow={1} />

      <Box justifyContent="center">
        <Text dimColor>{helpText}</Text>
      </Box>
    </Box>
  );
}

render(<AsciiClock />);
