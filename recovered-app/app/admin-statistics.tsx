import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import { getAppointments, getBarbers, getTreatments } from '../services/firebase';

export default function AdminStatisticsScreen() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalBarbers: 0,
    totalTreatments: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [appointments, barbers, treatments] = await Promise.all([
        getAppointments(),
        getBarbers(),
        getTreatments(),
      ]);

      const today = new Date();
      const todayAppointments = appointments.filter(apt => {
        const aptDate = apt.date.toDate();
        return aptDate.toDateString() === today.toDateString();
      });

      setStats({
        totalAppointments: appointments.length,
        totalBarbers: barbers.length,
        totalTreatments: treatments.length,
        todayAppointments: todayAppointments.length,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNav 
        title="סטטיסטיקות" 
        onBellPress={() => {}} 
        onMenuPress={() => {}}
        showBackButton={true}
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>סטטיסטיקות כלליות</Text>
        
        <StatCard
          title="סה״כ תורים"
          value={stats.totalAppointments}
          icon="calendar"
          color="#007AFF"
        />
        
        <StatCard
          title="תורים היום"
          value={stats.todayAppointments}
          icon="today"
          color="#34C759"
        />
        
        <StatCard
          title="מספר ספרים"
          value={stats.totalBarbers}
          icon="people"
          color="#FF9500"
        />
        
        <StatCard
          title="סוגי טיפולים"
          value={stats.totalTreatments}
          icon="cut"
          color="#AF52DE"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});