const SMARTLINK_URL = 'https://omg10.com/4/11528175';

export const openSmartLink = (): void => {
  if (typeof window !== 'undefined') {
    window.open(SMARTLINK_URL, '_blank', 'noopener,noreferrer');
  }
};

export default SMARTLINK_URL;
