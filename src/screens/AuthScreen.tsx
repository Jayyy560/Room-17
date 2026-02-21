import React, { useState } from 'react';
import { 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  StyleSheet,
  Image
} from 'react-native';
import { signInWithEmail, signUpWithEmail } from '../services/auth';
import { uploadImageAsync } from '../services/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  toggleSecure,
  isSecureVisible
}: any) => (
  <View style={styles.inputContainer}>
    <BlurView intensity={15} tint="light" style={styles.inputBlur}>
      <Ionicons name={icon} size={20} color={theme.colors.subtle} style={styles.inputIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtle}
        secureTextEntry={secureTextEntry && !isSecureVisible}
        style={styles.input}
        autoCapitalize="none"
      />
      {toggleSecure && (
        <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
          <Ionicons
            name={isSecureVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.colors.subtle}
          />
        </TouchableOpacity>
      )}
    </BlurView>
  </View>
);

const PROMPTS = [
  "A shower thought I recently had...",
  "I'm looking for...",
  "Two truths and a lie...",
  "My most controversial opinion is...",
  "I geek out on...",
  "The way to win me over is..."
];

const GENDERS = ['Male', 'Female'];

const SEXUALITIES = ['Straight', 'Gay', 'Lesbian', 'Bisexual'];

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/png?seed=Felix&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Jasper&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Mia&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Oliver&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Sophie&backgroundColor=c0aede',
];

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGender, setSelectedGender] = useState(GENDERS[0]);
  const [selectedSexuality, setSelectedSexuality] = useState(SEXUALITIES[0]);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0]);
  const [promptAnswer, setPromptAnswer] = useState('');
  const [photoURI, setPhotoURI] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!selectedGender || !dobDate) {
        setError('Please select gender and date of birth');
        return;
      }
      if (isUnderage) {
        setError('You must be at least 18 years old');
        return;
      }
      setError('');
      setStep(3);
    } else if (step === 3) {
      if (!selectedSexuality) {
        setError('Please select sexuality');
        return;
      }
      setError('');
      setStep(4);
    } else if (step === 4) {
      if (!promptAnswer) {
        setError('Please answer the prompt');
        return;
      }
      setError('');
      setStep(5);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
    setError('');
  };

  const getAge = (date: Date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > date.getMonth() ||
      (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
    return hasHadBirthdayThisYear ? age : age - 1;
  };

  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selected) {
      setDobDate(selected);
    }
  };

  const formattedDob = dobDate ? dobDate.toLocaleDateString() : 'Select date of birth';
  const dobAge = dobDate ? getAge(dobDate) : null;
  const isUnderage = dobAge !== null && dobAge < 18;

  const pickImage = async () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert('Permission to access camera is required!');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhotoURI(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert('Permission to access gallery is required!');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhotoURI(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      if (mode === 'signup') {
        if (!name || !promptAnswer) throw new Error('Name and prompt required');
        
        let finalPhotoURL = selectedAvatar;
        if (photoURI) {
          try {
            const filename = `avatars/${Date.now()}_${email.split('@')[0]}.jpg`;
            finalPhotoURL = await uploadImageAsync(photoURI, filename);
          } catch (uploadError) {
            console.log('Storage upload failed, falling back to avatar', uploadError);
            // Fallback to avatar if storage isn't set up or fails
            finalPhotoURL = selectedAvatar;
          }
        }

        const fullPrompt = `${selectedPrompt} - ${promptAnswer.trim()}`;
        const dobValue = dobDate ? dobDate.toISOString() : '';
        await signUpWithEmail(
          name.trim(),
          email.trim(),
          password,
          fullPrompt,
          selectedGender,
          selectedSexuality,
          dobValue,
          finalPhotoURL
        );
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      console.log('Auth error', e?.code, e?.message);
      setError(e?.code || e?.message || 'Unknown error');
      Alert.alert('Oops', e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.backgroundTop, theme.colors.backgroundBottom]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Abstract Background Shapes */}
      <View style={[styles.circle, { top: -100, right: -50, backgroundColor: 'rgba(154, 145, 132, 0.25)' }]} />
      <View style={[styles.circle, { bottom: -150, left: -50, width: 300, height: 300, backgroundColor: 'rgba(154, 145, 132, 0.18)' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={40} color={theme.colors.accent} />
            </View>
            <Text style={styles.title}>Room 17</Text>
            <Text style={styles.subtitle}>
              {mode === 'signup' ? 'Join the exclusive circle' : 'Welcome back, legend'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            {(mode === 'login' || step === 1) && (
              <>
                {mode === 'signup' && (
                  <InputField
                    icon="person-outline"
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                  />
                )}

                <InputField
                  icon="mail-outline"
                  placeholder="Your Email"
                  value={email}
                  onChangeText={setEmail}
                />

                <InputField
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  toggleSecure={() => setShowPassword(!showPassword)}
                  isSecureVisible={showPassword}
                />
              </>
            )}

            {mode === 'signup' && step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>About You</Text>
                <Text style={styles.stepSubtitle}>Gender</Text>
                <View style={styles.genderGrid}>
                  {GENDERS.map((gender, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedGender(gender)}
                      style={[
                        styles.genderChip,
                        selectedGender === gender && styles.genderChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selectedGender === gender && styles.genderChipTextSelected,
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.stepSubtitle}>Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateField}>
                  <BlurView intensity={15} tint="light" style={styles.dateBlur}>
                    <Text style={styles.dateText}>{formattedDob}</Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.subtle} />
                  </BlurView>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dobDate || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
                {isUnderage && (
                  <Text style={styles.warningText}>You must be at least 18 years old.</Text>
                )}
              </View>
            )}

            {mode === 'signup' && step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Orientation</Text>
                <Text style={styles.stepSubtitle}>Sexuality</Text>
                <View style={styles.genderGrid}>
                  {SEXUALITIES.map((value, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedSexuality(value)}
                      style={[
                        styles.genderChip,
                        selectedSexuality === value && styles.genderChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selectedSexuality === value && styles.genderChipTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {mode === 'signup' && step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Pick a Prompt</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.promptScroll}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {PROMPTS.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedPrompt(prompt)}
                      style={[
                        styles.promptChip,
                        selectedPrompt === prompt && styles.promptChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.promptChipText,
                          selectedPrompt === prompt && styles.promptChipTextSelected,
                        ]}
                      >
                        {prompt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <InputField
                  icon="flash-outline"
                  placeholder="Your Answer..."
                  value={promptAnswer}
                  onChangeText={setPromptAnswer}
                />
              </View>
            )}

            {mode === 'signup' && step === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Choose an Avatar</Text>
                
                <View style={styles.avatarGrid}>
                  {AVATARS.map((avatar, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedAvatar(avatar);
                        setPhotoURI('');
                      }}
                      style={[
                        styles.avatarOption,
                        selectedAvatar === avatar && !photoURI && styles.avatarOptionSelected
                      ]}
                    >
                      <Image source={{ uri: avatar }} style={styles.avatarImage} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.orText}>- OR -</Text>

                <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                  <BlurView intensity={20} tint="dark" style={styles.imagePickerBlur}>
                    {photoURI ? (
                      <Image source={{ uri: photoURI }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera-outline" size={32} color={theme.colors.subtle} />
                        <Text style={styles.imagePlaceholderText}>Upload Custom Photo</Text>
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.buttonRow}>
              {mode === 'signup' && step > 1 && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={mode === 'signup' && step < 5 ? handleNext : handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[theme.colors.cardAlt, theme.colors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Processing...' :
                     mode === 'login' ? 'Sign In' :
                     step < 5 ? 'Continue' : 'Get Access'}
                  </Text>
                  {!loading && (
                    <Ionicons
                      name={step < 5 && mode === 'signup' ? 'arrow-forward' : 'checkmark'}
                      size={20}
                      color={theme.colors.buttonText}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {step === 1 && (
              <TouchableOpacity 
                onPress={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setError('');
                }}
                style={styles.switchMode}
              >
                <Text style={styles.switchText}>
                  {mode === 'signup' ? 'Already inside? ' : 'New around here? '}
                  <Text style={styles.switchHighlight}>
                    {mode === 'signup' ? 'Log In' : 'Join Now'}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  circle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.inputBg,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.buttonBorder,
    backgroundColor: theme.colors.cardAlt,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
    elevation: 4,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontWeight: '700',
    fontSize: 18,
  },
  switchMode: {
    marginTop: 24,
    alignItems: 'center',
    padding: 10,
  },
  switchText: {
    color: theme.colors.muted,
    fontSize: 15,
  },
  switchHighlight: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179, 90, 69, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 90, 69, 0.3)',
  },
  errorText: {
    color: theme.colors.warning,
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  warningText: {
    color: theme.colors.warning,
    marginTop: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  imagePickerContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
  },
  imagePickerBlur: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBg,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  imagePlaceholderText: {
    color: theme.colors.muted,
    marginTop: 8,
    fontSize: 14,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  stepSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 4,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardAlt,
  },
  genderChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#eadfce',
  },
  genderChipText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  genderChipTextSelected: {
    color: theme.colors.accentDark,
    fontWeight: '600',
  },
  dateField: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    marginBottom: 8,
  },
  dateBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.inputBg,
  },
  dateText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: theme.colors.cardAlt,
  },
  avatarOptionSelected: {
    borderColor: theme.colors.accent,
    transform: [{ scale: 1.05 }],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  orText: {
    color: theme.colors.subtle,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  promptScroll: {
    marginBottom: 16,
  },
  promptChip: {
    backgroundColor: theme.colors.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promptChipSelected: {
    backgroundColor: '#eadfce',
    borderColor: theme.colors.accent,
  },
  promptChipText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  promptChipTextSelected: {
    color: theme.colors.accentDark,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});

export default AuthScreen;
