import uiTextsData from './uiTexts.json';

export interface UiTexts {
  app: {
    slogan: string;
    metaTitle: string;
  };
  header: {
    productsBadge: string;
    storesBadge: string;
    rateBadge: string;
    directoryButton: string;
    adminButton: string;
    ceoLoginButton: string;
  };
  hero: {
    title: string;
    subtitle: string;
    exploreStores: string;
    exploreProducts: string;
  };
  search: {
    inputPlaceholder: string;
    allProvinces: string;
    allMunicipalities: string;
    allRepartos: string;
    allCategories: string;
    allStores: string;
    allTags: string;
    deliveryOnly: string;
    availableOnly: string;
    servicesOnly: string;
    sortByFeatured: string;
    sortByPriceLow: string;
    sortByPriceHigh: string;
    sortByNewest: string;
  };
  store: {
    rateLabel: string;
    contactWhatsApp: string;
    viewProducts: string;
    deliveryBadge: string;
    ratingLabel: string;
    storesCount: string;
  };
  product: {
    contactWhatsApp: string;
    viewDetails: string;
    serviceTag: string;
    deliveryAvailable: string;
    outOfStock: string;
    inStock: string;
    featuredTag: string;
    productsCount: string;
  };
  admin: {
    portalTitle: string;
    ceoBadge: string;
    connectedStores: string;
    activeProducts: string;
    avgRate: string;
    tabs: {
      config: string;
      stores: string;
      products: string;
      backup: string;
    };
    configLabels: {
      identitySection: string;
      primaryColorLabel: string;
      secondaryColorLabel: string;
      accentColorLabel: string;
      marketplaceNameLabel: string;
      sloganLabel: string;
      logoUrlLabel: string;
      defaultStoreLogoLabel: string;
      defaultProductImageLabel: string;
      bannerTitleLabel: string;
      bannerSubtitleLabel: string;
      socialLinksSection: string;
      geoSection: string;
      departmentsSection: string;
      tagsSection: string;
      saveConfigButton: string;
    };
    tableHeaders: {
      image: string;
      name: string;
      slogan: string;
      location: string;
      rate: string;
      status: string;
      actions: string;
      category: string;
      price: string;
    };
    modals: {
      addStore: string;
      editStore: string;
      addProduct: string;
      editProduct: string;
      saveButton: string;
      cancelButton: string;
    };
  };
  backup: {
    title: string;
    description: string;
    exportJson: string;
    importJson: string;
    exportStoresCsv: string;
    exportProductsCsv: string;
    exportGeoCsv: string;
    exportDepartmentsCsv: string;
    exportTagsCsv: string;
    exportConfigCsv: string;
    importCsv: string;
    restoreDemo: string;
  };
  auth: {
    title: string;
    subtitle: string;
    loginTab: string;
    registerTab: string;
    emailLabel: string;
    passwordLabel: string;
    photoLabel: string;
    uploadPhotoBtn: string;
    twoFactorLabel: string;
    verifyEmailTitle: string;
    verifyEmailDesc: string;
    submitLogin: string;
    submitRegister: string;
  };
}

export const UI_TEXTS: UiTexts = uiTextsData as UiTexts;

export default UI_TEXTS;
