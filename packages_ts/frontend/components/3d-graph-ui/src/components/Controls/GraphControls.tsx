import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../hooks/useStores.js";
import { ISimulationConfig } from "../../types/models.js";

export interface GraphControlsProps {}

/**
 * GraphControls component
 *
 * Provides UI controls for the 3D graph including:
 * - Physics simulation controls (pause/resume)
 * - Physics configuration options
 * - Performance monitoring metrics
 */
const GraphControls: React.FC<GraphControlsProps> = observer(() => {
  const rootStore = useStores();
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ISimulationConfig>(
    rootStore.physicsStore.getConfig()
  );
  const [metrics, setMetrics] = useState({
    lastStepTime: 0,
    averageStepTime: 0,
    stepCount: 0,
  });

  // Update metrics periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMetrics(rootStore.getPhysicsPerformanceMetrics());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [rootStore]);

  // Handle config change
  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof ISimulationConfig
  ) => {
    const value = parseFloat(e.target.value);
    setConfig({ ...config, [key]: value });
  };

  // Apply config changes
  const applyConfig = () => {
    rootStore.updatePhysicsConfig(config);
  };

  // Toggle simulation running state
  const toggleSimulation = () => {
    rootStore.setIsRunning(!rootStore.isRunning);
  };

  return (
    <div
      className="graph-controls"
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        maxWidth: "300px",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={toggleSimulation}
          style={{
            padding: "5px 10px",
            marginRight: "10px",
            backgroundColor: rootStore.isRunning ? "#f44336" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {rootStore.isRunning ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            padding: "5px 10px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {showConfig ? "Hide Config" : "Show Config"}
        </button>
      </div>

      {/* Performance metrics */}
      <div style={{ marginBottom: "10px", fontSize: "12px" }}>
        <div>Last step time: {metrics.lastStepTime.toFixed(2)} ms</div>
        <div>Average step time: {metrics.averageStepTime.toFixed(2)} ms</div>
        <div>Steps: {metrics.stepCount}</div>
      </div>

      {/* Physics configuration */}
      {showConfig && (
        <div style={{ fontSize: "12px" }}>
          <h4 style={{ margin: "5px 0" }}>Physics Configuration</h4>

          <div style={{ marginBottom: "5px" }}>
            <label style={{ display: "block" }}>
              Spring Length: {config.springLength}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={config.springLength}
              onChange={(e) => handleConfigChange(e, "springLength")}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "5px" }}>
            <label style={{ display: "block" }}>
              Spring Coefficient: {config.springCoefficient.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={config.springCoefficient}
              onChange={(e) => handleConfigChange(e, "springCoefficient")}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "5px" }}>
            <label style={{ display: "block" }}>
              Gravity: {config.gravity}
            </label>
            <input
              type="range"
              min="-20"
              max="0"
              step="1"
              value={config.gravity}
              onChange={(e) => handleConfigChange(e, "gravity")}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "5px" }}>
            <label style={{ display: "block" }}>
              Drag Coefficient: {config.dragCoefficient.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.dragCoefficient}
              onChange={(e) => handleConfigChange(e, "dragCoefficient")}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "5px" }}>
            <label style={{ display: "block" }}>
              Theta: {config.theta.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.theta}
              onChange={(e) => handleConfigChange(e, "theta")}
              style={{ width: "100%" }}
            />
          </div>

          <button
            onClick={applyConfig}
            style={{
              padding: "5px 10px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              width: "100%",
              marginTop: "5px",
            }}
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
});

export default GraphControls;
