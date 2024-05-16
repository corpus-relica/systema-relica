import React, { useEffect, useState } from "react";
import { HSMManager } from "@relica/hsm-manager";
import { SelectField } from "react-admin";

const Modelling = () => {
    // Declare state to hold machine names
    const [machineNames, setMachineNames] = useState([]);
    const [hsmManager, setHSMManager] = useState(null);

    useEffect(() => {
        // Initialize HSMManager and fetch machine names
        const manager = new HSMManager();
        setHSMManager(manager);
        const names = manager.getMachineNames();
        setMachineNames(names);
    }, []); // Empty dependency array means this effect runs once after the initial render

    const handleButtonClick = () => {
        console.log("INIT machine");
        // send 'init' intnetion to server
        // wait on result
        // if possitive result init here:
        if (hsmManager) hsmManager.startMachine(machineNames[0]);
    };

    return (
        <div>
            <h1>Modelling</h1>
            <div>Select HSM to run</div>
            <select>
                {machineNames.map((name, index) => (
                    <option key={index} value={name}>
                        {name}
                    </option>
                ))}
            </select>
            <button onClick={handleButtonClick}>go</button>
        </div>
    );
};

export default Modelling;
