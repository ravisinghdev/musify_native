export type RootStackParamList = {
  MainTabs: undefined;
  AuthStack: undefined;
  FullPlayerModal: undefined;
  VideoPlayerScreen: { trackId: string };
  AlbumDetails: { albumId: string };
  ArtistProfile: { artistId: string };
  PlaylistDetails: { playlistId: string };
  LyricsScreen: { trackId: string };
  QueueModal: undefined;
  UserProfile: undefined;
  EditProfile: undefined;
  PremiumSubscription: undefined;
  NotificationCenter: undefined;
  AudioQualitySettings: undefined;
  StorageCacheSettings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  LibraryTab: undefined;
  SettingsTab: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OnboardingGenres: undefined;
};

