import React, { useEffect, useState } from "react";
import { render, Box, Text } from "ink";

const padSingleNum = (n) => String(n).padStart(2, "0");

const formatTime = (date) =>
  `${padSingleNum(date.getHours())}:${padSingleNum(date.getMinutes())}:${padSingleNum(date.getSeconds())}`;

function BasicClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return React.createElement(
    Box,
    null,
    React.createElement(Text, { color: "green" }, formatTime(now)),
  );
}

render(React.createElement(BasicClock));
