export const NodeMath = {
    'math_chain': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
        let result = Number(runner.getInputValue(node, 'v0')) || 0;
                
        const ops = node.data?.ops || ['add'];

        for (let i = 0; i < ops.length; i++) {
            const nextValIndex = i + 1;
            const nextVal = Number(runner.getInputValue(node, `v${nextValIndex}`)) || 0;
            const op = ops[i];

            switch (op) {
            case 'add': 
                result += nextVal;
                break;
            case 'subtract': 
                result -= nextVal; 
                break;
            case 'multiply': 
                result *= nextVal; 
                break;
            case 'divide': 
                result = nextVal !== 0 ? result / nextVal : 0; 
                break;
            case 'modulo':
                result = nextVal !== 0 ? result % nextVal : 0;
                break;
            }
        }

        return outputKey === 'res' ? result : 0;
        }
    },
    'math_negate': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0;
            
            return outputKey === 'res' ? -a : 0;
        }
    },
    'math_distance_2d': {
        getOutput: (runner, node, outputKey) => {
            const x1 = Number(runner.getInputValue(node, 'x1')) || 0;
            const y1 = Number(runner.getInputValue(node, 'y1')) || 0;
            const x2 = Number(runner.getInputValue(node, 'x2')) || 0;
            const y2 = Number(runner.getInputValue(node, 'y2')) || 0;
            
            if (outputKey === 'res') {
                return Math.hypot(x2 - x1, y2 - y1);
            }
            return 0;
        }
    },

    'math_direction_2d': {
        getOutput: (runner, node, outputKey) => {
            const x1 = Number(runner.getInputValue(node, 'from_x')) || 0;
            const y1 = Number(runner.getInputValue(node, 'from_y')) || 0;
            const x2 = Number(runner.getInputValue(node, 'to_x')) || 0;
            const y2 = Number(runner.getInputValue(node, 'to_y')) || 0;
            
            const dx = x2 - x1;
            const dy = y2 - y1;

            if (outputKey === 'angle') {
                return Math.atan2(dy, dx) * (180 / Math.PI);
            }

            const dist = Math.hypot(dx, dy);
            
            if (dist === 0) return 0; 

            if (outputKey === 'dir_x') return dx / dist;
            if (outputKey === 'dir_y') return dy / dist;

            return 0;
        }
    }
};