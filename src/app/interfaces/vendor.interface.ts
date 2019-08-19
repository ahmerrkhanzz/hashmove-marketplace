
export interface LogisticService {
  LogServName: string;
  ImageName: string;
}

export interface Affiliation {
  AssnWithCode: string;
  AssnWithName: string;
  AssnWithImage: string;
  AssnWithWebAdd: string;
}

export interface SelectedProvider {
  ProviderID: number;
  ProviderName: string;
  ProviderPhone: string;
  ProviderRating?: any;
  ProviderVerified?: any;
  ProviderImage: string;
  ProviderEmail: string;
  ProviderAddress: string;
  ProviderAddressLine2?: any;
  ProviderWebAdd: string;
  ProviderBusinessStartDate?: string;
  FaxNo?: string;
  POBox: string;
  City?: any;
  About: string;
  ProfileID: string;
  TotalBooking: number;
  TotalReviews: number;
  ProviderGallery: string;
  AwdCrtfGallery: string;
  LogisticServices: LogisticService[];
  Affiliations: Affiliation[];
}

