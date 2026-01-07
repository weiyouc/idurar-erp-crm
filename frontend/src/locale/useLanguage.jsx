import languages from './translation/translation';

const getLabel = (key, currentLanguage = 'en_us') => {
  try {
    const lowerCaseKey = key
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/ /g, '_');

    // Get the language pack
    const lang = languages[currentLanguage] || languages.en_us;
    
    // Check if translation exists
    if (lang[lowerCaseKey]) {
      return lang[lowerCaseKey];
    }

    // Fallback: convert key to readable label
    const remove_underscore_fromKey = key.replace(/_/g, ' ').split(' ');

    const conversionOfAllFirstCharacterofEachWord = remove_underscore_fromKey.map(
      (word) => word[0].toUpperCase() + word.substring(1)
    );

    const label = conversionOfAllFirstCharacterofEachWord.join(' ');

    return label;
  } catch (error) {
    return 'No translate';
  }
};

const useLanguage = () => {
  // Get current language from localStorage
  const currentLanguage = localStorage.getItem('language') || 'en_us';
  
  const translate = (value) => getLabel(value, currentLanguage);

  return translate;
};

export default useLanguage;
