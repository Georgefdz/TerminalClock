import React, { useEffect, useState } from "react";
import { render, Box, Text, useStdout, useInput, useApp } from "ink";
import figlet from "figlet";

const FONTS = ["Big", "Standard", "Banner", "Slant", "Small"];

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

function AsciiClock() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [now, setNow] = useState(new Date());
  const [asciiArt, setAsciiArt] = useState("");
  const [hue, setHue] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [use12h, setUse12h] = useState(false);

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
  const helpText = `q/Esc: quit  f: ${use12h ? "24h" : "12h"}  a/d: font (${fontName})`;

  const innerCols = dimensions.cols - 4;
  const innerRows = dimensions.rows - 2;
  const clockBlockHeight = bannerHeight + 2;
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

      <Box flexGrow={1} />

      <Box justifyContent="center">
        <Text dimColor>{helpText}</Text>
      </Box>
    </Box>
  );
}

render(<AsciiClock />);
