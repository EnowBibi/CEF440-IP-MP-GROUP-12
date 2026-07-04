import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateProfile, uploadProfilePicture } from "@/api/user";
import { useFeedback } from "@/components/feedback";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/config";
import { BottomTabInset, Palette, Spacing } from "@/constants/theme";

function initials(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function memberSince(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuth();
  const { confirm, toast } = useFeedback();
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [saving, setSaving] = useState(false);

  const avatarUrl = resolveMediaUrl(user?.profilePictureUrl);

  const changePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setUploading(true);
    try {
      const updated = await uploadProfilePicture({
        uri: a.uri,
        fileName: a.fileName,
        mimeType: a.mimeType,
      });
      setUser(updated);
      toast({ type: "success", message: "Profile photo updated." });
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Could not update your photo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const openEdit = () => {
    setName(user?.fullName ?? "");
    setEditOpen(true);
  };

  const saveName = async () => {
    const parts = name.trim().split(/\s+/);
    if (!parts[0]) {
      toast({ type: "error", message: "Please enter your name." });
      return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || firstName;
    setSaving(true);
    try {
      const updated = await updateProfile(firstName, lastName);
      setUser(updated);
      setEditOpen(false);
      toast({ type: "success", message: "Profile updated." });
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Could not save your name.",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = async () => {
    const ok = await confirm({
      title: "Log out",
      message: "Are you sure you want to log out?",
      confirmText: "Log out",
      destructive: true,
    });
    if (ok) await signOut();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <Pressable onPress={changePhoto} style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="camera" size={15} color="#fff" />
              )}
            </View>
          </Pressable>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {!!user?.createdAt && (
            <Text style={styles.memberSince}>
              Member since {memberSince(user.createdAt)}
            </Text>
          )}
          <TouchableOpacity style={styles.editButton} onPress={openEdit}>
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.rowLabel}>Email</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="key-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.rowLabel}>Sign-in method</Text>
            </View>
            <Text style={styles.rowValue}>
              {user?.oAuthProvider && user.oAuthProvider !== "LOCAL"
                ? user.oAuthProvider
                : "Email & password"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={Palette.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit name modal */}
      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#5a6079"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditOpen(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={saveName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0e27" },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  userCard: {
    backgroundColor: "#141a36",
    borderRadius: 18,
    padding: Spacing.four,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#222a4d",
  },
  avatarWrap: { marginBottom: Spacing.two },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#00AAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1f2547",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1f2547",
    borderWidth: 2,
    borderColor: "#0a0e27",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: { color: "#fff", fontSize: 14 },
  userName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  userEmail: { color: "#8A8F98", fontSize: 14 },
  memberSince: { color: "#5a6079", fontSize: 12, marginTop: 2 },
  editButton: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: "#00AAFF",
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editButtonText: { color: "#00AAFF", fontWeight: "700", fontSize: 14 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: -Spacing.two,
  },
  group: {
    backgroundColor: "#141a36",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222a4d",
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  rowLabel: { color: "#8A8F98", fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "500", flexShrink: 1 },
  divider: { height: 1, backgroundColor: "#1a2038" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: "#1a1226",
    borderWidth: 1,
    borderColor: "#3a1530",
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutText: { color: "#FF4444", fontSize: 15, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  modalCard: {
    backgroundColor: "#141a36",
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  input: {
    backgroundColor: "#0a0e27",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222a4d",
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  modalButtons: { flexDirection: "row", gap: Spacing.three },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1f2547",
  },
  modalCancelText: { color: "#aab3d6", fontWeight: "600" },
  modalSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#00AAFF",
  },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});
