import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Card from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function SubjectDetailScreen({ route }) {
  const subject = route.params?.subject;

  if (!subject) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: subject.color || COLORS.primary }]}>
          <Text style={styles.name}>{subject.name}</Text>
          {subject.code && <Text style={styles.code}>{subject.code}</Text>}
        </View>

        <Card title="Details" icon="information-circle-outline">
          <DetailRow label="Instructor" value={subject.instructor} />
          <DetailRow label="Semester" value={subject.semester} />
          <DetailRow label="Room" value={subject.room} />
          <DetailRow label="Meeting Link" value={subject.meeting_link} />
          <DetailRow label="Status" value={subject.status} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  header: {
    padding: SPACING.xxl,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.white },
  code: { fontSize: FONTS.sizes.lg, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  detailValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: '500', textTransform: 'capitalize' },
});
