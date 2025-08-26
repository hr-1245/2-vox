import { ConversationDetails } from '@/_components/ghl/conversations/ConversationDetails';
import { getCurrentUserProviderData } from '@/utils/providers/providerUtils';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';
import { notFound } from 'next/navigation';

interface ConversationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ 
    contact?: string;
    email?: string;
    phone?: string;
  }>;
}

export default async function ConversationPage({ params, searchParams }: ConversationPageProps) {
  const { id } = await params;
  const { contact, email, phone } = await searchParams;

  // Get provider data to get location ID
  const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
  if (!providerData?.data?.location_id) {
    notFound();
  }

  // Add query params for contact info that ConversationDetails will pick up
  const searchParamsString = new URLSearchParams({
    ...(contact && { contact }),
    ...(email && { email }),
    ...(phone && { phone })
  }).toString();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ConversationDetails
          conversationId={id}
          locationId={providerData.data.location_id}
        />
      </div>
    </div>
  );
}
