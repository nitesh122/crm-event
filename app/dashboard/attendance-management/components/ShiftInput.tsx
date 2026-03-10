export interface ShiftInputProps {
    value: number;
    onChange: (value: number) => void;
}

export default function ShiftInput({ value, onChange }: ShiftInputProps) {
    const shiftOptions = [0, 0.5, 1, 1.5, 2];

    return (
        <select
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="min-w-[3rem] w-12 px-0 py-1 text-center border-0 text-xs font-medium bg-transparent cursor-pointer"
        >
            {shiftOptions.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}
