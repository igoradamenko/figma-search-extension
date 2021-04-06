# Figma Search Extension

<img align="right"
     alt="Лого проекта: лупа с иконкой компонента внутри"
     src="icon.svg"
     width="128"
     height="128">

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/lfofpannpmmeeicgiiacjghmcfgnebbi?label=Chrome%20Web%20Store) ![Mozilla Add-on](https://img.shields.io/amo/v/figma-search?label=Mozilla%20Add-ons)

Поиск для объектов Figma, работающий даже в режиме «View only».

Поддерживаемые браузеры: Chrome, Firefox и любой браузер на основе Chromium (Edge, Opera, Yandex.Browser и другие).

[In English](./README.md)

[![Figma Search в Chrome Web Store](./add-to-chrome.svg)](https://chrome.google.com/webstore/detail/figma-search/lfofpannpmmeeicgiiacjghmcfgnebbi)
[![Figma Search в Mozilla Add-ons](./add-to-firefox.svg)](https://addons.mozilla.org/en-US/firefox/addon/figma-search/)

[![Демо видео на Ютубе](./youtube-demo.png)](https://youtu.be/F4wWJUe3JxQ)

## Contents

- [Мотивация](#мотивация)
- [Особенности](#особенности)
  - [Сочетание клавиш](#сочетание-клавиш)
  - [Навигация с клавиатуры](#навигация-с-клавиатуры)
  - [Глубокий поиск](#глубокий-поиск)
- [Установка](#установка)
  - [Chrome Web Store](#chrome-web-store)
  - [Firefox Add-ons](#firefox-add-ons)
  - [Ручная установка](#ручная-установка)
    - [Chrome и иные браузеры на основе Chromium](#chrome-и-иные-браузеры-на-основе-chromium)
    - [Firefox](#firefox)
- [Ещё](#ещё)
- [Благодарности](#благодарности)

## Мотивация

В Figma нет встроенного поиска по объектам в макете. Да, можно использовать различные плагины, но они не работают
в режиме «View only». Можно было бы копировать каждый файл в черновики, чтобы получать полные права и использовать 
плагины там, но это утомительно.

Потому был создан этот плагин, как временное решение до тех пор, пока разработчики Фигмы не добавят функцию поиска.

## Особенности

Несколько важных штук, о которых стоит знать.

### Сочетание клавиш

Если нажать `Alt` + `Shift` + `F`, расширение активируется.

Сочетание клавиш можно изменить в настройках браузера.

**Иногда после установки расширения сочетание клавиш не работает.** В таком случае нужно переназначить его в настройках
браузера.

### Навигация с клавиатуры

Нажатие на любую кнопку кроме `Arrow Down`, `Arrow Up` или `Enter` при фокусе на попапе будет обработано строкой поиска.
Нажатие же на эти клавиши позволяет перемещаться по результатам поиска без использования мыши.

### Глубокий поиск

Увы, Figma не всегда подгружает все страницы в режиме «View only», потому по умолчанию в поиске участвуют только те, 
что загружены. Так что, если файл состоит из большого количества страниц, их нужно прогрузить, дабы результаты поиска
были точнее.

Расширение умеет подгружать страницы самостоятельно. Если макет загружен не до конца, в попапе появится кнопка 
«Try Deep Search». Клик на эту кнопку вызовет прогрузку страниц макета и последующее повторение поискового запроса.

## Установка

### Chrome Web Store

Пользователям Chrome или иного браузера на основе Chromium (Edge, Opera, Yandex.Browser, пр.) стоит устанавливать 
расширение из официального магазина Chrome:

**[Figma Search](https://chrome.google.com/webstore/detail/figma-search/lfofpannpmmeeicgiiacjghmcfgnebbi) в Chrome Web Store**

Нажмите на ссылку выше, и на открывшейся странице нажмите на «Add to Chrome».

### Firefox Add-ons

Пользователям Firefox стоит устанавливать расширение из официального магазина Firefox:

**[Figma Search](https://addons.mozilla.org/en-US/firefox/addon/figma-search/) в Firefox Browser Add-ons**

Нажмите на ссылку выше, и на открывшейся странице нажмите на «Add to Firefox».

### Ручная установка

#### Chrome и иные браузеры на основе Chromium

1. [Скачайте самый свежий релиз расширения](https://github.com/igoradamenko/figma-search-extension/releases).
2. Распакуйте скаченный архив куда-то, где его данные не будут случайно удалены.
3. Откройте `chrome://extensions` в браузере.
4. Включите «Developer mode» (обычно кнопка для его включения находится где-то в углу страницы).
5. Нажмите «Load unpacked» (эта кнопка появляется только после включения режима разработчика).
6. Выберите папку с распакованным расширением (из п. 2).
7. Перезагрузите страницы Figma, которые были открыты до установки приложения, и можете начинать работу с расширением.

После перезагрузки браузер может предупредить о том, что установлено расширение к которому «нет доверия».
Но с этим ничего не поделаешь, это цена, которую приходится платить за установку расширений из исходников. 

#### Firefox

Пользователи Windows и macOS должны установить [Firefox Developer Edition](https://www.mozilla.org/ru/firefox/developer/)
или [Firefox Nightly](https://www.mozilla.org/ru/firefox/channel/desktop/#nightly). Увы, установить распакованное
расширение в обычный Firefox так, чтобы оно не удалилось после перезагрузки браузера, нельзя.

Пользователем Linux и тем, кто установил описанные выше браузеры, нужно:

1. [Скачать самый свежий релиз расширения](https://github.com/igoradamenko/figma-search-extension/releases).
2. Открыть `about:config`, принять риск, найти переменную `xpinstall.signatures.required` и выставить её в `false`.
3. Открыть `about:addons`, нажать на иконку настроек и выбрать «Install Add-on From File...» из раскрывшегося меню.
4. Выбрать скаченный ZIP-файл с расширением (из п. 1).
5. Одобрить установку.

## Ещё

- **[Figma Mixed Styles Extension](https://github.com/igoradamenko/figma-mixed-styles-extension)**

## Благодарности

Задизайнил [Руслан Дальцаев](https://dribbble.com/workmachine).

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
