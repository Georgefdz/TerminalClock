import React, { useEffect, useState } from "react";
import { render, Box, Text, useStdout } from "ink";
import figlet from "figlet";

const padSingleNum = (n) => String(n).padStart(2, "0");
const formatTime = (date) =>
  `${padSingleNum(date.getHours())}:${padSingleNum(date.getMinutes())}:${padSingleNum(date.getSeconds())}`;

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
  const { stdout } = useStdout();
  const [now, setNow] = useState(new Date());
  const [asciiArt, setAsciiArt] = useState("");
  const [hue, setHue] = useState(0);

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
    const timeString = formatTime(now);
    let cancelled = false;

    createAsciiText(timeString, { font: "Big" })
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
  }, [now.getHours(), now.getMinutes(), now.getSeconds()]);

  const lines = asciiArt.split("\n");
  const bannerHeight = lines.length;
  const bannerWidth = Math.max(...lines.map((line) => line.length), 0);

  const topPadding = Math.max(
    0,
    Math.floor((dimensions.rows - bannerHeight) / 2),
  );
  const leftPadding = Math.max(
    0,
    Math.floor((dimensions.cols - bannerWidth) / 2),
  );

  const color = hslToHex(hue, 80, 55);

  return (
    <Box
      flexDirection="column"
      width={dimensions.cols}
      height={dimensions.rows}
    >
      <Box height={topPadding} />

      <Box flexDirection="column" paddingLeft={leftPadding}>
        {lines.map((line, index) => (
          <Text key={index} color={color}>
            {line}
          </Text>
        ))}
      </Box>

      <Box flexGrow={1} />
    </Box>
  );
}

render(<AsciiClock />);
