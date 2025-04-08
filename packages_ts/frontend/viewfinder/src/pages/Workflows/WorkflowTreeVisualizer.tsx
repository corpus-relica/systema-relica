import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";

const WorkflowTreeVisualizer = (props: any) => {
  const { tree, currentId } = props;

  const ref2 = useRef();

  useEffect(() => {
    if (tree.length === 0) return;

    console.log("GOT TREE:", tree);

    // Clear the existing SVG content
    d3.select(ref2.current).selectAll("*").remove();

    const foo = tree.map((t) => {
      return { name: t[0], parent: t[1] };
    });

    foo.unshift({ name: tree[0][1], parent: "" });

    const root = d3
      .stratify()
      .id((d: any) => d.name)
      .parentId((d: any) => d.parent)(foo);

    // Set dimensions
    const margin = { top: 10, right: 80, bottom: 10, left: 80 };
    // const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    // Compute the layout
    const nodeSize = [40, 100]; // [height, width] for each node
    const treeLayout = d3.tree().nodeSize(nodeSize);
    treeLayout(root);

    // Calculate the bounds of the tree
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    root.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const width = y1 - y0 + margin.left + margin.right;
    const height = x1 - x0 + margin.top + margin.bottom;

    // Calculate offsets to center the tree
    const xOffset = -((x0 + x1) / 2);
    const yOffset = -y0;

    // Create SVG
    const svg = d3
      .select(ref2.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [
        -margin.left,
        -margin.top,
        width + margin.left + margin.right,
        height + margin.top + margin.bottom,
      ])
      .attr("style", "max-width: 100%; height: auto; background-color:#ffffff;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    // Create a group for the tree and center it
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2 - y1 / 2},${height / 2})`);

    // Add links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
      );

    // Add nodes
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Add circles to nodes
    node
      .append("circle")
      .attr("fill", (d: any) => {
        if (d.id === currentId) {
          return "red";
        }
        return d.children ? "#555" : "#999";
      })
      .attr("r", 5);

    // Add labels to nodes
    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => (d.children ? -6 : 6))
      .attr("text-anchor", (d: any) => (d.children ? "end" : "start"))
      .text((d: any) => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);
  }, [tree]);

  return <svg ref={ref2} />;
};

export default WorkflowTreeVisualizer;
