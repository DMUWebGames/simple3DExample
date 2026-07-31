const layouts = {
    float: {
        size: 4,
        align: 4
    },
    vec2: {
        size: 8,
        align: 8
    },
    vec3: {
        size: 12,
        align: 16
    },
    vec4: {
        size: 16,
        align: 16
    },
    mat4: {
        size: 64,
        align: 16
    }
}

function getType(v) {
    let type = typeof (v);
    if (type == "object" && Array.isArray(v)) {
        type = "array";
    }
    return type;
}

export function getLayout(v) {
    const type = getType(v);

    // scalar
    if (type === "number") {
        return layouts.float;
    }

    // arrays
    if (type === "array") {
        switch (v.length) {
            case 2: return layouts.vec2;
            case 3: return layouts.vec3;
            case 4: return layouts.vec4;
            case 16: return layouts.mat4;
            default: throw new Error(`
                Unsupported array length ${v.length}.
                [${v}]
                Valid lengths (${Object.entries(layouts).map(([k, v]) => `${k} = ${v.size}`).join(", ")})
                Use an object to define a struct.
            `);
        }
    }

    // struct
    if (v && type === "object") {
        let offset = 0;
        let maxAlign = 4;
        for (const field of Object.values(v)) {
            const { size, align } = getLayout(field);
            offset = Math.ceil(offset / align) * align;
            offset += size;
            maxAlign = Math.max(maxAlign, align);
        }
        const finalSize = Math.ceil(offset / maxAlign) * maxAlign;
        return { size: finalSize, align: maxAlign };
    }

    throw new Error(`
        Unsupported type ${type}: ${v}
        Valid types (number, array, object)
    `);
}
