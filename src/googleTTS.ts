import url from 'url';

interface Option {
  lang?: string;
  slow?: boolean;
  host?: string;
}

export default (
  text: string,
  { lang = 'en', slow = false, host = 'https://translate.google.com' }: Option = {}
): string => {

  if (text.length > 200) {
    throw new RangeError(
      `text length (${text.length}) should be less than 200 characters. Try "getAllAudioUrls(text, [option])" for long text.`
    );
  }

  return (
    host +
    '/translate_tts' +
    url.format({
      query: {
        ie: 'UTF-8',
        q: text,
        tl: lang,
        total: 1,
        idx: 0,
        textlen: text.length,
        client: 'tw-ob',
        prev: 'input',
        ttsspeed: slow ? 0.24 : 1,
      },
    })
  );
};
