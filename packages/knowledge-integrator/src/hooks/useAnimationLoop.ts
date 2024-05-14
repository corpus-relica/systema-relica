import { useEffect } from "react";
import { toJS } from "mobx";

const thresholdNear = 160;
const thresholdFar = 10; //150;

const useAnimationLoop = (fgRef, graphData) => {
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      if (fgRef.current) {
        const camera = fgRef.current.camera();
        const { position } = camera;
        graphData.nodes.forEach((node) => {
          const distance = Math.sqrt(
            Math.pow(position.x - node.x, 2) +
              Math.pow(position.y - node.y, 2) +
              Math.pow(position.z - node.z, 2)
          );
          // NODE LABEL
          const nodeEl = document.getElementById("node-label-" + node.id);
          // console.log(nodeEl);
          if (nodeEl) {
            if (distance < thresholdNear) {
              const foo = thresholdNear - distance;
              // console.log(foo);
              nodeEl.style.fontWeight = "800";
              nodeEl.style.fontSize = "16px";
              nodeEl.style.opacity = "1";
            } else {
              // nodeEl.style.fontWeight =
              //   "" +
              //   (100 +
              //     Math.max(
              //       Math.round(
              //         1 - (distance - thresholdNear) / thresholdFar,
              //         0
              //       )
              //     ) *
              //       700);
              // nodeEl.style.fontSize = "12px";
              nodeEl.style.opacity =
                "" +
                Math.max(1 - (distance - thresholdNear) / thresholdFar, 0.0025);
            }
            // if (highlightNodes.has(node)) {
            //   nodeEl.style.color = "red";
            // }
          }
        });

        // LINKS
        graphData.links.forEach((link) => {
          // console.log(link);
          const { source, target } = link;
          const lineObj = link.__lineObj;
          const curve = link.__curve;
          const arrowObj = link.__arrowObj;
          if (source && target) {
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const midZ = (source.z + target.z) / 2;

            const distance = Math.sqrt(
              Math.pow(camera.position.x - midX, 2) +
                Math.pow(camera.position.y - midY, 2) +
                Math.pow(camera.position.z - midZ, 2)
            );

            if (lineObj && lineObj.material) {
              lineObj.material.transparent = true; // Enable transparency
              if (distance < thresholdNear) {
                // lineObj.material.color.set(0xff0000); // Set to red
                lineObj.material.opacity = 1;
              } else {
                // lineObj.material.color.set(0x00ff00); // Set to green
                lineObj.material.opacity = Math.max(
                  1 - (distance - thresholdNear) / thresholdFar,
                  0.3
                );
              }
              lineObj.material.needsUpdate = true; // Signal to Three.js that this material needs to be updated
            }
            // console.log(hoveredLink, link.id);
            // if (hoveredLink?.id === link.id) {
            //   lineObj.material.color.set("#ff0000"); // Set to red
            //   arrowObj.material.color.set("#ff0000");
            // }
          }
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (fgRef.current) {
      animate();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [fgRef, graphData]);
};

export default useAnimationLoop;
