// https://observablehq.com/d/8eedaf343fbf468a@452
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([
    [
      "world_cup_geo.tsv",
      new URL(
        "./files/996f34d80f943493331f24575d01187aa473033b23989fe066bc1ac23dc4be758f7d5f788c3fe00e03428553ab47d0d69c2b282ca8890534ac730ed28c5230cc",
        import.meta.url
      ),
    ],
  ]);
  main.builtin(
    "FileAttachment",
    runtime.fileAttachments((name) => fileAttachments.get(name))
  );
  main.variable(observer()).define(["md"], function (md) {
    return md`
# Charting`;
  });
  main.variable(observer()).define(["html"], function (html) {
    return html`<h2>World Cup Attendance</h2>`;
  });
  main
    .variable(observer("chart"))
    .define(
      "chart",
      ["d3", "width", "height", "data", "x", "y", "xAxis", "yAxis"],
      function (d3, width, height, data, x, y, xAxis, yAxis) {
        const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

        // Regular expression for matching country name from url
        const re = /_([A-Z]+)_/;

        // Function to determine if the host country team is playing or not
        const isHomeCountry = (d) => {
          const homeTeam = d.url.match(re)[1];
          if (
            d.team1.toUpperCase() === homeTeam ||
            d.team2.toUpperCase() === homeTeam
          ) {
            return true;
          } else if (
            d.year === "2002" &&
            ([d.team1, d.team2].includes("South Korea") ||
              [d.team1, d.team2].includes("Japan"))
          ) {
            return true;
          } else if (
            d.year === "2010" &&
            [d.team1, d.team2].includes("South Africa")
          ) {
            return true;
          } else {
            return false;
          }
        };

        svg
          .append("g")
          .selectAll("circle")
          .data(data)
          .join("circle")
          .attr("cx", (d) => x(d3.timeYear(d.date)))
          .attr("cy", (d) => y(d.attendance))
          .attr("r", (d) => (isHomeCountry(d) ? "5px" : "3px"))
          .attr("opacity", 0.5)
          .attr("fill", (d) => (isHomeCountry(d) ? "red" : "steelblue"));

        svg.append("g").call(xAxis);

        svg.append("g").call(yAxis);

        /* Legend */
        var legend = svg
          .append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${width - 150}, ${50})`)
          .selectAll("g")
          .data(["Home Team", "Others"])
          .enter()
          .append("g");

        legend
          .append("text")
          .attr("y", (d, i) => i * 30 + 5)
          .attr("x", 15)
          .attr("font-size", "10pt")
          .text((d) => d);

        legend
          .append("circle")
          .attr("cy", (d, i) => i * 30)
          .attr("r", (d) => (d === "Home Team" ? "5px" : "3px"))
          .attr("fill", (d) => (d === "Home Team" ? "red" : "steelblue"))
          .attr("opacity", 0.5);

        return svg.node();
      }
    );
  main
    .variable(observer("x"))
    .define("x", ["d3", "margin", "width"], function (d3, margin, width) {
      const begin = new Date(1928, 0, 1);
      const end = new Date(2016, 0, 1);
      return (
        d3
          .scaleTime()
          //.domain(d3.extent(data, d => d.date))
          .domain([begin, end])
          .range([margin.left, width - margin.right])
      );
    });
  main
    .variable(observer("y"))
    .define("y", ["d3", "data", "height", "margin"], function (
      d3,
      data,
      height,
      margin
    ) {
      return d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.attendance) + 10000])
        .range([height - margin.bottom, margin.top]);
    });
  main
    .variable(observer("xAxis"))
    .define("xAxis", ["height", "margin", "d3", "x", "width"], function (
      height,
      margin,
      d3,
      x,
      width
    ) {
      return (g) =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(
            d3
              .axisBottom(x)
              .ticks(
                d3.timeYear.filter((d) => {
                  return (d.getFullYear() - 2) % 4 === 0;
                })
              )
              //.ticks(d3.timeYear.every(4))
              .tickSizeOuter(0)
          )
          .call((g) =>
            g
              .append("text")
              .attr("x", width - margin.right)
              .attr("y", -6)
              .attr("fill", "currentColor")
              .attr("text-anchor", "end")
              .attr("font-weight", "bold")
              .attr("font-size", "9pt")
              .text("Year")
          );
    });
  main
    .variable(observer("yAxis"))
    .define("yAxis", ["margin", "d3", "y"], function (margin, d3, y) {
      return (g) =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(10))
          .call((g) => g.select(".domain").remove())
          .call((g) =>
            g
              .select(".tick:last-of-type text")
              .clone()
              .attr("x", 4)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .attr("font-size", "9pt")
              .text("Attendance")
          );
    });
  main.variable(observer("height")).define("height", function () {
    return 500;
  });
  main.variable(observer("margin")).define("margin", function () {
    return { top: 20, right: 20, bottom: 30, left: 50 };
  });
  main
    .variable(observer("data"))
    .define("data", ["d3", "FileAttachment", "dateParser"], async function (
      d3,
      FileAttachment,
      dateParser
    ) {
      return d3.tsvParse(
        await FileAttachment("world_cup_geo.tsv").text(),
        (d) => {
          d.date = dateParser(d.date);
          d.attendance = +d.attendance;
          return d;
        }
      );
    });
  main
    .variable(observer("dateParser"))
    .define("dateParser", ["d3"], function (d3) {
      return d3.timeParse("%d-%m-%Y (%H:%M h)");
    });
  main.variable(observer("d3")).define("d3", ["require"], function (require) {
    return require("d3@5");
  });
  return main;
}
