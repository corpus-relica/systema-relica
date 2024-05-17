import React, { useEffect, useState } from "react";
import { HSMManager } from "@relica/hsm-manager";
import { SelectInput, SimpleForm, Form } from "react-admin";

// import {
//     useQuery,
//     // useMutation,
//     // useQueryClient,
//     // QueryClient,
//     // QueryClientProvider,
// } from "@tanstack/react-query";

// const fetchUsers = async () => {
//     const res = await fetch("https://jsonplaceholder.typicode.com/users");
//     return res.json();
// };

const Modelling = () => {
    // Declare state to hold machine names
    const [machineNames, setMachineNames] = useState([]);
    const [hsmManager, setHSMManager] = useState(null);
    const [stack, setStack] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [pendingStates, setPendingStates] = useState([]);

    // const {
    //     isPending: isStackPending,
    //     isError: isStackError,
    //     data: stackData,
    //     error: stackError,
    // } = useQuery({
    //     queryKey: ["stack"],
    //     queryFn: fetchStack,
    // });

    useEffect(() => {
        // Initialize HSMManager and fetch machine names
        const manager = new HSMManager();
        setHSMManager(manager);

        manager.addEventListener("machine:start", () => {
            setIsRunning(true);
            console.log("machine start");
        });
        manager.addEventListener("stack:push", () => {
            const st = manager.getStack();
            setStack(st);
            console.log("stack push!", st);
        });
        manager.addEventListener("stack:pop", () => {
            const st = manager.getStack();
            setStack(st);
            console.log("stack pop!", st);
        });
        manager.addEventListener("state:change", () => {
            console.log("STATE:CHANGE", manager.getSnapshot());
            setPendingStates(manager.getPendingStates());
        });

        setMachineNames(manager.getMachineNames());
        setStack(manager.getStack());
        setIsRunning(manager.isMachineRunning());
    }, []); // Empty dependency array means this effect runs once after the initial render

    const handleSubmit = (data) => {
        console.log("INIT machine: ", data["Machine Names"]);
        // send 'init' intnetion to server
        // wait on result
        // if possitive result init here:
        if (hsmManager) hsmManager.startMachine(data["Machine Names"]);
    };

    return (
        <div>
            <h1>Modelling</h1>
            {isRunning === false ? (
                <SimpleForm onSubmit={handleSubmit}>
                    <SelectInput
                        source="Machine Names"
                        choices={machineNames.map((name, index) => {
                            return {
                                id: name,
                                name: name,
                            };
                        })}
                    />
                </SimpleForm>
            ) : (
                <div>
                    <div>
                        current machine:
                        {hsmManager && hsmManager.getCurrentMachineName()}
                    </div>
                    <div>
                        current state:
                        {hsmManager && hsmManager.getCurrentStateName()}
                    </div>
                    <div>stack size: {stack.length}</div>
                    <div>
                        <div>pending states: </div>
                        <div>
                            {pendingStates.map((state) => (
                                <button
                                    key={state}
                                    onClick={() => {
                                        hsmManager.sendEvent({
                                            type: state,
                                        });
                                    }}
                                >
                                    {state}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Modelling;
