export const logicNode = {
    // --- BRANCH (IF / ELSE) ---
    'logic_branch': {
        execute: (runner, node) => {
            const condition = runner.getInputValue(node, 'condition')
            if (condition === true) {
                runner.executeFlow(node._id, 'true')
            } else {
                runner.executeFlow(node._id, 'false')
            }
        }
    },

    // --- BOOLEAN LOGIC (AND / OR / NOT) ---
    'logic_and': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a && b) : false
        }
    },
    'logic_or': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a || b) : false
        }
    },

    // --- LOOPS (Advanced) ---
    'logic_loop': { // For Loop
        execute: (runner, node) => {
            const start = Number(runner.getInputValue(node, 'start')) || 0
            const end = Number(runner.getInputValue(node, 'end')) || 0
            
            for (let i = start; i < end; i++) {
                // Set nilai index sementara untuk loop ini (bisa disimpan di scope khusus jika mau)
                // Untuk simplifikasi, kita asumsikan output 'index' diambil realtime.
                runner._tempLoopIndex = i 
                runner.executeFlow(node._id, 'loop') 
            }
            runner.executeFlow(node._id, 'completed')
        },
        getOutput: (runner, node, outputKey) => {
            // Mengambil nilai index saat loop berjalan
            return outputKey === 'index' ? (runner._tempLoopIndex || 0) : 0
        }
    }
}