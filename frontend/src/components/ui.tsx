import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../constants/colors';

/** Reusable dark card */
export const Card: React.FC<React.PropsWithChildren<{ style?: any; testID?: string }>> = ({ children, style, testID }) => (
  <View style={[cardStyles.card, style]} testID={testID}>{children}</View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
});

/** Screen title (h1) */
export const ScreenTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode; testID?: string }> = ({ children, right, testID }) => (
  <View style={titleStyles.row}>
    <Text style={titleStyles.title} testID={testID}>{children}</Text>
    {right}
  </View>
);

const titleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.foreground, letterSpacing: -0.6 },
});

/** Dark search bar */
export const SearchBar: React.FC<{
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
}> = ({ value, onChangeText, placeholder = 'Search', testID }) => (
  <View style={searchStyles.wrap}>
    <Feather name="search" size={16} color={colors.mutedForeground} />
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      style={searchStyles.input}
      autoCapitalize="none"
      autoCorrect={false}
    />
    <Feather name="mic" size={16} color={colors.mutedForeground} />
  </View>
);

const searchStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1B1C1C', borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 20, marginBottom: 12,
  },
  input: { flex: 1, color: colors.foreground, fontSize: 14, paddingVertical: 0 },
});
