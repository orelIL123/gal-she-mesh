import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import TopNav from '../../components/TopNav';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TopNav 
        title="גלריה" 
        onBellPress={() => {}} 
        onMenuPress={() => {}}
      />
      <View style={styles.content}>
        <Text style={styles.title}>גלריה</Text>
        <Text style={styles.subtitle}>תמונות מהעבודה שלנו</Text>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
