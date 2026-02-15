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

function AsciiClock() {
  const { stdout } = useStdout();
  const [now, setNow] = useState(new Date());
  const [asciiArt, setAsciiArt] = useState("");
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

  return React.createElement(
    Box,
    {
      flexDirection: "column",
      width: dimensions.cols,
      height: dimensions.rows,
    },
    React.createElement(Box, { height: topPadding }),
    React.createElement(
      Box,
      { flexDirection: "column", paddingLeft: leftPadding },
      ...lines.map((line, index) =>
        React.createElement(Text, { key: index, color: "cyan" }, line),
      ),
    ),
    React.createElement(Box, { flexGrow: 1 }),
  );
}

render(React.createElement(AsciiClock));
