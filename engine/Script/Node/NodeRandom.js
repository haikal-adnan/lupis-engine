export const NodeRandom = {
    'random_smart': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            const minIn = runner.getInputValue(node, 'min');
            const maxIn = runner.getInputValue(node, 'max');

            const min = (minIn !== undefined && minIn !== null) ? minIn : node.data?.values?.min;
            const max = (maxIn !== undefined && maxIn !== null) ? maxIn : node.data?.values?.max;

            const numMin = Number(min ?? 0);
            const numMax = Number(max ?? 1);

            if (Number.isInteger(numMin) && Number.isInteger(numMax)) {
                return Math.floor(Math.random() * (numMax - numMin + 1)) + numMin;
            } else {
                return Math.random() * (numMax - numMin) + numMin;
            }
        }
    },

    'random_boolean': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            return Math.random() < 0.5;
        }
    },

    'random_from_list': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'item') return null;
            
            const list = runner.getInputValue(node, 'list');
            
            if (Array.isArray(list) && list.length > 0) {
                const randomIndex = Math.floor(Math.random() * list.length);
                return list[randomIndex];
            }
            return null;
        }
    },

    'random_chance': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            const chanceIn = runner.getInputValue(node, 'chance');
            const chance = (chanceIn !== undefined && chanceIn !== null) ? chanceIn : node.data?.values?.chance;
            
            const numChance = Number(chance ?? 50);

            return (Math.random() * 100) < numChance;
        }
    },

    'random_color': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'color') return null;
            
            const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            
            return `#${randomHex}`;
        }
    }
};