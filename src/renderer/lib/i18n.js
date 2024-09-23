GT.languages = {
  en: "i18n/en.json",
  cn: "i18n/cn.json",
  cnt: "i18n/cn-t.json",
  de: "i18n/de.json",
  fr: "i18n/fr.json",
  it: "i18n/it.json",
  es: "i18n/es.json"
};

GT.i18n = {};

function readLocaleFile(locale)
{
  if (locale in GT.languages)
  {
    try
    {
      GT.i18n = requireJson(GT.languages[locale]);
    }
    catch (e)
    {
      console.error("Failed to load: " + GT.languages[locale]);
      GT.i18n = {};
    }
  }
}

function loadI18n()
{
  readLocaleFile(GT.appSettings.locale);
  refreshI18NStrings();
}

function renderI18n()
{
  const elements = document.querySelectorAll("[data-i18n]");
  for (let x = 0; x < elements.length; x++)
  {
    const key = elements[x].getAttribute("data-i18n");
    if (key in GT.i18n)
    {
      if (key.endsWith(".hover"))
      {
        elements[x].title = GT.i18n[key];
      }
      else
      {
        elements[x].innerHTML = GT.i18n[key];
        if (key.endsWith(".label"))
        {
          let hover = key.replace(".label", ".hover");
          if (hover in GT.i18n)
          {
            elements[x].title = GT.i18n[hover];
          }
        }
      }
    }
    else
    {
      console.error("Missing Body I18N Key: ", key);
    }
  }
}

function I18N(key)
{
  if (key in GT.i18n)
  {
    return GT.i18n[key];
  }
  else
  {
    console.error("Missing Direct I18N Key: ", key);
    return key;
  }
}

function changeLocale()
{
  GT.appSettings.locale = languageLocale.value;
  renderI18n(GT.appSettings.locale);
  saveAndCloseApp(true);
}

function loadChildWindowI18n()
{
  readLocaleFile(window.opener.GT.appSettings.locale);
  renderI18n();
}

function loadRosterI18n()
{
  readLocaleFile(window.opener.GT.appSettings.locale);
  renderI18n();
  addControls();
}

function renderLocale()
{
  renderI18n();
}
