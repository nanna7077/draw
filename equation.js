function evaluateEquation(input) {
    input = input.trim();
    if (!input.endsWith('=')) {
        return null;
    }
    input = input.slice(0, -1).trim();
    let equation;
    let variables = {};
    if (input.includes(' ')) {
        let parts = input.split(' ');
        for (let part of parts) {
            if (part.includes('=')) {
                let assignmentParts = part.split('=');
                if (assignmentParts.length !== 2) {
                    throw new Error('Invalid variable assignment format: ' + part);
                }
                let variable = assignmentParts[0].trim();
                let value = parseFloat(assignmentParts[1].trim());
                variables[variable] = value;
            } else {
                if (equation !== undefined) {
                    throw new Error('Invalid input format. Multiple equations found.');
                }
                equation = part;
            }
        }
    } else {
        equation = input;
    }
    for (let variable in variables) {
        if (variables.hasOwnProperty(variable)) {
            let regex = new RegExp('\\b' + variable + '\\b', 'g');
            equation = equation.replace(regex, variables[variable]);
        }
    }
    let result;
    try {
        equation = equation.replace(/([-+*/])/g, ' $1 ');
        result = eval(equation);
    } catch (error) {
        throw new Error('Failed to evaluate equation: ' + error.message);
    }
    return result;
}

function convertUnits(input) {
    try {
        input = input.toLowerCase().trim().replace(/\s+/g, ' ');
        const regex = /^(\d+(\.\d+)?)\s*(\w+)\s*to\s*(\w+)$/;
        const match = input.match(regex);
        if (!match) {
            return null;
        }
        const value = parseFloat(match[1]);
        const fromUnit = match[3];
        const toUnit = match[4];
        const from = math.unit(value, fromUnit);
        const result = from.to(toUnit);
        return result.value;
    } catch (error) {
        return null;
    }
}
