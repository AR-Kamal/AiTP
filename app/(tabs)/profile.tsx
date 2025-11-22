import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile) {
      setAge(profile.age?.toString() || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // TODO: Upload to Supabase Storage
      // For now, just use the local URI
      setAvatarUrl(result.assets[0].uri);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    const ageNum = parseInt(age);
    
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age: ageNum,
          avatar_url: avatarUrl,
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update local state
      if (profile) {
        setProfile({ ...profile, age: ageNum, avatar_url: avatarUrl });
      }

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/splash');
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={60} color="#9ca3af" />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <View style={styles.infoValueContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoValue}>{profile.full_name}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueContainer}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nationality</Text>
            <View style={styles.infoValueContainer}>
              <Ionicons name="flag-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoValue}>{profile.nationality}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Age</Text>
            <View style={styles.infoValueContainer}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              {editing ? (
                <TextInput
                  style={styles.infoInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="Enter age"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.age} years old</Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {editing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setAge(profile.age?.toString() || '');
                  setAvatarUrl(profile.avatar_url || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color="#10b981" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#10b981',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: '#eee',
    elevation:5,   // needed for emulator rendering
    zIndex: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 20,   // needed for emulator rendering
    zIndex: 20,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  infoInput: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
    padding: 0,
  },
  actionSection: {
    gap: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  signOutButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});