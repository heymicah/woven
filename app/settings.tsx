import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../constants/Colors";
import { useAuth } from "../hooks/useAuth";
import { usersService } from "../services/users.service";
import { uploadService } from "../services/upload.service";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth();

    const [username, setUsername] = useState(user?.username || "");
    const [email] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || "");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Password change
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // Notifications
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission needed",
                "Please allow access to your photo library to change your profile picture."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const localUri = result.assets[0].uri;
            setAvatarUri(localUri);
            setUploading(true);
            try {
                const cloudinaryUrl = await uploadService.uploadImage(localUri);
                setAvatarUri(cloudinaryUrl);
            } catch {
                Alert.alert("Upload failed", "Could not upload image. Please try again.");
                setAvatarUri(user?.avatarUrl || "");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await usersService.updateMe({ username, bio, avatarUrl: avatarUri } as any);
            updateUser({ username, bio, avatarUrl: avatarUri });
            Alert.alert("Saved", "Your profile has been updated.", [
                { text: "OK", onPress: () => router.replace("/(tabs)/profile") },
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert("Error", "Please fill in all password fields.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match.");
            return;
        }

        setChangingPassword(true);
        try {
            await usersService.changePassword(currentPassword, newPassword);
            Alert.alert("Success", "Your password has been changed.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPassword(false);
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Failed to change password.";
            Alert.alert("Error", msg);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: logout,
            },
        ]);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={{ flex: 1, backgroundColor: Colors.surface }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingTop: 72,
                        paddingBottom: 16,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.surface,
                    }}
                >
                    <Pressable
                        onPress={() => router.replace("/(tabs)/profile")}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: Colors.secondary,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
                    </Pressable>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: Colors.heading,
                            marginLeft: 12,
                        }}
                    >
                        Settings
                    </Text>
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Edit Profile Section ── */}
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: Colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 12,
                        }}
                    >
                        Profile
                    </Text>

                    <View
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            marginBottom: 24,
                        }}
                    >
                        {/* Profile Picture */}
                        <View style={{ alignItems: "center", marginBottom: 20 }}>
                            <Pressable onPress={pickImage}>
                                <View
                                    style={{
                                        width: 96,
                                        height: 96,
                                        borderRadius: 48,
                                        backgroundColor: Colors.secondary,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                    }}
                                >
                                    {avatarUri ? (
                                        <Image
                                            source={{ uri: avatarUri }}
                                            style={{ width: 96, height: 96 }}
                                        />
                                    ) : (
                                        <Ionicons name="person" size={40} color={Colors.primary} />
                                    )}
                                </View>
                                {/* Camera badge */}
                                <View
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: Colors.primary,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 3,
                                        borderColor: "#FFFFFF",
                                    }}
                                >
                                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                                </View>
                            </Pressable>
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: Colors.textSecondary,
                                    marginTop: 8,
                                }}
                            >
                                {uploading ? "Uploading..." : "Tap to change photo"}
                            </Text>
                        </View>

                        {/* Username */}
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 }}>
                            Username
                        </Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            style={{
                                fontSize: 16,
                                color: Colors.text,
                                backgroundColor: Colors.surface,
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor: Colors.border,
                                marginBottom: 16,
                            }}
                            placeholderTextColor={Colors.textSecondary}
                        />

                        {/* Email */}
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 }}>
                            Email
                        </Text>
                        <Text style={{ fontSize: 16, color: Colors.text, marginBottom: 16 }}>
                            {email}
                        </Text>

                        {/* Bio */}
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 }}>
                            Bio
                        </Text>
                        <TextInput
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={3}
                            onFocus={() => {
                                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                            }}
                            style={{
                                fontSize: 16,
                                color: Colors.text,
                                backgroundColor: Colors.surface,
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor: Colors.border,
                                minHeight: 80,
                                textAlignVertical: "top",
                                marginBottom: 16,
                            }}
                            placeholder="Tell others about yourself..."
                            placeholderTextColor={Colors.textSecondary}
                        />

                        {/* Save Button */}
                        <Pressable
                            onPress={handleSave}
                            disabled={saving || uploading}
                            style={{
                                backgroundColor: Colors.primary,
                                borderRadius: 12,
                                paddingVertical: 14,
                                alignItems: "center",
                                opacity: saving || uploading ? 0.6 : 1,
                            }}
                        >
                            <Text style={{ color: Colors.heading, fontWeight: "700", fontSize: 15 }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* ── Security Section ── */}
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: Colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 12,
                        }}
                    >
                        Security
                    </Text>

                    <View
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            overflow: "hidden",
                            marginBottom: 24,
                        }}
                    >
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                            }}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.text} />
                            <Text style={{ fontSize: 16, color: Colors.text, fontWeight: "600", marginLeft: 12, flex: 1 }}>
                                Change Password
                            </Text>
                            <Ionicons
                                name={showPassword ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={Colors.textSecondary}
                            />
                        </Pressable>

                        {showPassword && (
                            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                <TextInput
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                    placeholder="Current password"
                                    placeholderTextColor={Colors.textSecondary}
                                    onFocus={() => {
                                        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                                    }}
                                    style={{
                                        fontSize: 15, color: Colors.text, backgroundColor: Colors.surface,
                                        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                                        borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
                                    }}
                                />
                                <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    placeholder="New password (min 6 chars)"
                                    placeholderTextColor={Colors.textSecondary}
                                    style={{
                                        fontSize: 15, color: Colors.text, backgroundColor: Colors.surface,
                                        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                                        borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
                                    }}
                                />
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholder="Confirm new password"
                                    placeholderTextColor={Colors.textSecondary}
                                    style={{
                                        fontSize: 15, color: Colors.text, backgroundColor: Colors.surface,
                                        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                                        borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
                                    }}
                                />
                                <Pressable
                                    onPress={handleChangePassword}
                                    disabled={changingPassword}
                                    style={{
                                        backgroundColor: Colors.primary,
                                        borderRadius: 10,
                                        paddingVertical: 12,
                                        alignItems: "center",
                                        opacity: changingPassword ? 0.6 : 1,
                                    }}
                                >
                                    <Text style={{ color: Colors.heading, fontWeight: "700", fontSize: 14 }}>
                                        {changingPassword ? "Updating..." : "Update Password"}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* ── Preferences Section ── */}
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: Colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 12,
                        }}
                    >
                        Preferences
                    </Text>

                    <View
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            overflow: "hidden",
                            marginBottom: 24,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                            }}
                        >
                            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
                            <Text style={{ fontSize: 16, color: Colors.text, fontWeight: "600", marginLeft: 12, flex: 1 }}>
                                Notifications
                            </Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    {/* ── Account Section ── */}
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: Colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 12,
                        }}
                    >
                        Account
                    </Text>

                    <View
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            overflow: "hidden",
                            marginBottom: 24,
                        }}
                    >
                        <Pressable
                            onPress={handleSignOut}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                            }}
                        >
                            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                            <Text style={{ fontSize: 16, color: Colors.error, fontWeight: "600", marginLeft: 12, flex: 1 }}>
                                Sign Out
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
                        </Pressable>
                    </View>

                    {/* ── App Version ── */}
                    <Text
                        style={{
                            fontSize: 12,
                            color: Colors.textSecondary,
                            textAlign: "center",
                            marginTop: 8,
                            marginBottom: 20,
                        }}
                    >
                        Woven v1.0.0
                    </Text>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}
