import React, { useEffect, useState } from "react";
import { render, Box, Text } from "ink";
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
  const [now, setNow] = useState(new Date());
  const [asciiArt, setAsciiArt] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeString = formatTime(now);

    createAsciiText(timeString, { font: "Big" })
      .then((banner) => {
        setAsciiArt(banner);
      })
      .catch(() => {
        setAsciiArt(timeString);
      });
  }, [now.getHours(), now.getMinutes(), now.getSeconds()]);

  return React.createElement(
    Box,
    { flexDirection: "column" },
    asciiArt
      .split("\n")
      .map((line, index) =>
        React.createElement(Text, { key: index, color: "cyan" }, line),
      ),
  );
}

render(React.createElement(AsciiClock));
