import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useCreateVehicleMutation } from '../../../store/api/vehiclesApi';

const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z
    .number({ invalid_type_error: 'Year must be a number' })
    .int()
    .min(1900)
    .max(currentYear + 1),
  licensePlate: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  currentMileage: z.number().min(0).optional(),
  nickname: z.string().max(100).optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function NewVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createVehicle, { isLoading }] = useCreateVehicleMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { make: '', model: '', year: currentYear },
  });

  const onSubmit = async (values: VehicleForm) => {
    try {
      await createVehicle({
        make: values.make,
        model: values.model,
        year: values.year,
        licensePlate: values.licensePlate || undefined,
        color: values.color || undefined,
        currentMileage: values.currentMileage || undefined,
        nickname: values.nickname || undefined,
      }).unwrap();
      router.back();
    } catch (err: any) {
      const msg = err?.data?.businessErrorDescription ?? t('common.retry');
      Alert.alert(t('common.error'), msg);
    }
  };

  const Field = ({
    label,
    name,
    placeholder,
    keyboardType = 'default',
  }: {
    label: string;
    name: keyof VehicleForm;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, !!errors[name] && styles.inputError]}
            placeholder={placeholder}
            value={String(value ?? '')}
            onChangeText={(text) =>
              onChange(keyboardType === 'numeric' ? (text ? Number(text) : undefined) : text)
            }
            keyboardType={keyboardType}
          />
        )}
      />
      {errors[name] && (
        <AppText style={styles.errorText}>
          {name === 'year'
            ? t('vehicles.yearInvalid', { max: currentYear + 1 })
            : t('errors.required')}
        </AppText>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.addVehicle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Field label={t('vehicles.make')} name="make" placeholder={t('vehicles.makePlaceholder')} />
        <Field label={t('vehicles.model')} name="model" placeholder={t('vehicles.modelPlaceholder')} />
        <Field label={t('vehicles.year')} name="year" placeholder={t('vehicles.yearPlaceholder')} keyboardType="numeric" />
        <Field label={t('vehicles.licensePlate')} name="licensePlate" placeholder={t('vehicles.licensePlatePlaceholder')} />
        <Field label={t('vehicles.color')} name="color" placeholder={t('vehicles.colorPlaceholder')} />
        <Field label={t('vehicles.mileage')} name="currentMileage" placeholder={t('vehicles.mileagePlaceholder')} keyboardType="numeric" />
        <Field label={t('vehicles.nickname')} name="nickname" placeholder={t('vehicles.nicknamePlaceholder')} />
        <AppButton
          title={t('vehicles.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.saveBtn as any}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  inputError: { borderColor: '#F44336' },
  errorText: { fontSize: 12, color: '#F44336', marginTop: 4 },
  saveBtn: { marginTop: 8 },
});
