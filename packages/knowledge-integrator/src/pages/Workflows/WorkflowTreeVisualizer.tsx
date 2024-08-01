import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";

const WorkflowTreeVisualizer = (props: any) => {
  const { tree } = props;

  const ref = useRef();
  const ref2 = useRef();

  const [dy, setDY] = useState(0);
  const [dx, setDX] = useState(0);
  const [x0, setX0] = useState(Infinity);
  const [x1, setX1] = useState(-Infinity);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [padding, setPadding] = useState(1);

  // useEffect(() => {}, []);
  useEffect(() => {
    console.log(
      "-------------------------------------------------REDRAW BAR GRAPH?????",
      tree
    );

    if (tree.length === 0) return;

    const foo = tree.map((t) => {
      return { name: t[0], parent: t[1] };
    });

    foo.unshift({ name: tree[0][1], parent: "" });

    const root = d3
      .stratify()
      .id((d: any) => d.name)
      .parentId((d: any) => d.parent)(foo);

    console.log("ROOT ROOT ROOT ROOT ROOT ROOT ROOT ");
    console.log(root);

    /////////////////////////////////////////////////////////////
    // set the dimensions and margins of the graph
    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
      width = 460 - margin.left - margin.right;
    let height = 400 - margin.top - margin.bottom;

    // Compute labels and titles.
    const descendants = root.descendants();
    const L = descendants.map((d: any) => d.data.name);

    // Compute the layout.
    const padding = 1;
    const dx = height / 2;
    const dy = width / (root.height + padding);
    d3.tree().nodeSize([dx, dy])(root);

    // Center the tree.
    let x0 = Infinity;
    let x1 = -x0;
    root.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    console.log(x0, x1);
    // Compute the default height.
    if (height === undefined) height = x1 - x0 + dx * 2;

    console.log("%%%%%%%%%%%%%%%%%%%% DX DY", dx, dy, width, height);
    console.log((-dy * padding) / 2, x0 - dx, width, height);

    const svg2 = d3
      // @ts-ignore
      .select(ref2.current)
      .attr("viewBox", [(-dy * padding) / 2, x0 - dx, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr(
        "style",
        "background-color:#ffffff; max-width: 100%; height: auto; height: intrinsic;"
      )
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const stroke = "#555"; // stroke for links
    const strokeWidth = 1.5; // stroke width for links
    const strokeOpacity = 0.4; // stroke opacity for links

    svg2
      .append("g")
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-opacity", strokeOpacity)
      // .attr("stroke-linecap", strokeLinecap)
      // .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-width", strokeWidth)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        //@ts-ignore
        d3
          .link(d3.curveBumpX)
          .x((d) => d.y)
          .y((d) => d.x)
      );

    const link = null;
    const linkTarget = "";

    const node = svg2
      .append("g")
      .selectAll("a")
      .data(root.descendants())
      .join("a")
      // .attr("xlink:href", link == null ? null : (d) => link(d.data, d))
      .attr("target", link == null ? null : linkTarget)
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    const fill = "#999";
    const r = 10;
    node
      .append("circle")
      .attr("fill", (d) => (d.children ? stroke : fill))
      .attr("r", r);

    const halo = "#fff"; // color of label halo
    const haloWidth = 3; // padding around the labels

    if (L)
      node
        .append("text")
        .attr("dy", "0.32em")
        .attr("x", (d) => (d.children ? -6 : 6))
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .attr("paint-order", "stroke")
        .attr("stroke", halo)
        .attr("stroke-width", haloWidth)
        .text((d, i) => L[i]);
  }, [tree]);

  return (
    <>
      <svg id="tree" ref={ref2} />
    </>
  );
};

export default WorkflowTreeVisualizer;
