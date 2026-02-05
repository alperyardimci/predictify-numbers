import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getRecords } from '../utils/storage';
import { formatTime } from '../utils/gameLogic';
import { Record } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';

const tabs = [2, 3, 4, 5];

export function RecordsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(4);
  const [records, setRecords] = useState<Record[]>([]);

  const loadRecords = async (digits: number) => {
    const data = await getRecords(digits);
    setRecords(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadRecords(activeTab);
    }, [activeTab])
  );

  useEffect(() => {
    loadRecords(activeTab);
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rekor Tablosu</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab} Hane
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.recordsList} showsVerticalScrollIndicator={false}>
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz rekor yok</Text>
            <Text style={styles.emptySubtext}>
              {activeTab} haneli oyun oynayarak rekor kırın!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
              <Text style={[styles.headerCell, styles.movesCell]}>Hamle</Text>
              <Text style={[styles.headerCell, styles.timeCell]}>Süre</Text>
              <Text style={[styles.headerCell, styles.dateCell]}>Tarih</Text>
            </View>
            {records.map((record, index) => (
              <View
                key={record.id}
                style={[
                  styles.recordRow,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}
              >
                <View style={[styles.cell, styles.rankCell]}>
                  <Text
                    style={[
                      styles.rankText,
                      index < 3 && styles.topRankText,
                    ]}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </Text>
                </View>
                <Text style={[styles.cellText, styles.movesCell]}>
                  {record.moves}
                </Text>
                <Text style={[styles.cellText, styles.timeCell]}>
                  {formatTime(record.timeSeconds)}
                </Text>
                <Text style={[styles.cellText, styles.dateCell]}>
                  {formatDate(record.date)}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  recordsList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyText: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  firstPlace: {
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  secondPlace: {
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    borderWidth: 1,
    borderColor: '#CD7F32',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 16,
    color: colors.text,
  },
  rankCell: {
    width: 50,
    textAlign: 'center',
  },
  movesCell: {
    flex: 1,
    textAlign: 'center',
  },
  timeCell: {
    flex: 1,
    textAlign: 'center',
  },
  dateCell: {
    flex: 1.5,
    textAlign: 'center',
  },
  rankText: {
    fontSize: 18,
    color: colors.text,
  },
  topRankText: {
    fontSize: 22,
  },
});
