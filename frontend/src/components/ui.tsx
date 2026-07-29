import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

/** Reusable card — background follows active theme */
export const Card: React.FC<React.PropsWithChildren<{ style?: any; testID?: string }>> = ({ children, style, testID }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }, style]}
      testID={testID}
    >
      {children}
    </View>
  );
};

/** Screen title (h1) */
export const ScreenTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode; testID?: string }> = ({ children, right, testID }) => {
  const { colors } = useTheme();
  return (
    <View style={titleStyles.row}>
      <Text style={[titleStyles.title, { color: colors.foreground }]} testID={testID}>{children}</Text>
      {right}
    </View>
  );
};

const titleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
});

/** Search bar — colours follow active theme */
export const SearchBar: React.FC<{
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
}> = ({ value, onChangeText, placeholder = 'Search', testID }) => {
  const { colors } = useTheme();
  return (
    <View style={[searchStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={16} color={colors.mutedForeground} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[searchStyles.input, { color: colors.foreground }]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Feather name="mic" size={16} color={colors.mutedForeground} />
    </View>
  );
};

const searchStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 20, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
});
