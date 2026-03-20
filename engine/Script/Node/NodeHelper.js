export const NodeHelper = {
    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        }
    },
    'logic_delay': {
        execute: async (runner, node) => {
            const durationInput = runner.getInputValue(node, 'duration');
            const duration = durationInput !== undefined && durationInput !== null 
                ? Number(durationInput) 
                : (node.data?.values?.duration || 1.0);
            
            // Menghentikan flow sementara menggunakan Promise & setTimeout
            await new Promise(resolve => setTimeout(resolve, duration * 1000));
            
            runner.executeFlow(node._id, 'out');
        }
    }
};