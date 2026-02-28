import { StyleSheet, View } from "react-native";
import { SelectableChip } from "./SelectableChip";

interface ChipItem<T> {
  value: T;
  labelKey: string;
  /** Optional raw label (e.g. for numbers); if set, used instead of t(labelKey) */
  label?: string;
}

interface ChipRowProps<T> {
  items: ChipItem<T>[];
  selected: T | T[];
  onSelect: (value: T) => void;
  multiSelect?: boolean;
}

export function ChipRow<T extends string | number>({
  items,
  selected,
  onSelect,
  multiSelect = false,
}: ChipRowProps<T>) {
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
  });

  const isSelected = (value: T) =>
    multiSelect
      ? (selected as T[]).includes(value)
      : (selected as T) === value;

  const handlePress = (value: T) => onSelect(value);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <SelectableChip
          key={String(item.value)}
          selected={isSelected(item.value)}
          onPress={() => handlePress(item.value)}
          label={item.label ?? item.labelKey}
          labelIsRaw={!!item.label}
        />
      ))}
    </View>
  );
}
