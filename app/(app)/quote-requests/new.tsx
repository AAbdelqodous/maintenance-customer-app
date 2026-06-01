import { useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { RequestComposer } from '../../../components/quotes/RequestComposer';
import { useCreateQuoteRequestMutation } from '../../../store/api/quoteRequestsApi';
import { useTranslation } from 'react-i18next';
import type { CreateQuoteRequest } from '../../../types/quoteRequests';

// Spec 009 US1 — compose + broadcast a quote request.
export default function NewQuoteRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [createQuoteRequest, { isLoading }] = useCreateQuoteRequestMutation();

  const handleSubmit = async (data: CreateQuoteRequest) => {
    try {
      const created = await createQuoteRequest(data).unwrap();
      if (created.reachCount === 0) {
        Alert.alert(
          t('quoteRequests.compose.title'),
          t('quoteRequests.compose.noMatches'),
        );
        return;
      }
      // Replace so Back returns to where Get Quotes was tapped, not the empty composer.
      router.replace(`/(app)/quote-requests/${created.id}`);
    } catch {
      Alert.alert(t('quoteRequests.compose.title'), t('errors.serverError'));
    }
  };

  return <RequestComposer onSubmit={handleSubmit} submitting={isLoading} />;
}
