import type { LocalizedText } from "@/lib/localized-setting";

/**
 * The shop's policy pages.
 *
 * Content is bilingual markdown held in SiteSettings and edited in the admin,
 * so it can be corrected without a deploy. Each page ships with a skeleton of
 * the headings an EU distance seller has to cover — those are a starting point
 * to complete and have checked, not legal advice and not sufficient as-is.
 */

export const LEGAL_PAGES = ["terms", "privacy", "returns"] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];

export function isLegalPage(value: unknown): value is LegalPage {
  return (
    typeof value === "string" &&
    (LEGAL_PAGES as readonly string[]).includes(value)
  );
}

/** SiteSettings key for a page's content. */
export function legalSettingsKey(page: LegalPage): string {
  return `legal:${page}`;
}

/**
 * The trader's own details.
 *
 * A registered company has to identify itself on its commercial pages, and the
 * same details appear across all three policies — hence one definition.
 */
const TRADER = {
  nameEn: "Nordkins Ltd.",
  nameBg: "Нордкинс ЕООД",
  addressEn: "65 Vasil Levski str., Sofia [postal code], Bulgaria",
  addressBg: "ул. „Васил Левски“ 65, София [пощенски код], България",
  email: "d.boqdzhieva@gmail.com",
};

const TODO_EN =
  "> **To complete:** replace every square-bracketed placeholder below, then " +
  "have this reviewed. These headings cover what an EU distance seller must " +
  "disclose; the wording is a starting point, not legal advice.";

const TODO_BG =
  "> **За довършване:** заменете всички означени в квадратни скоби места " +
  "по-долу и дайте текста за правен преглед. Заглавията покриват " +
  "изискванията към дистанционната продажба в ЕС, но текстът не е правен съвет.";

export const DEFAULT_CONTENT: Record<LegalPage, LocalizedText> = {
  terms: {
    en: `${TODO_EN}

## Who you are buying from

${TRADER.nameEn}, ${TRADER.addressEn}.
Email: ${TRADER.email}.
Company number (ЕИК): [ЕИК]. [VAT number — add it, or state that the company is
not VAT-registered.]

## The products

Original prints, linocut stamps and accessories, made and sold by the artist.
Each listing states its medium, dimensions and year. Because the work is
hand-made, slight variation between a photograph and the item you receive is
normal.

## Prices and delivery costs

All prices are in EUR and include [VAT, or: are not subject to VAT]. Delivery is
charged on top and is shown before you pay — the total you confirm at checkout
is the total you are charged. Nothing else is added.

## Placing an order

Selecting a delivery option and completing payment places a binding order. You
will receive confirmation by email. Payment is handled by Stripe; this shop
never sees or stores your card details.

## Delivery

Orders are dispatched within [N] working days. Delivery within Bulgaria
typically takes [N] working days; elsewhere in the EU, [N]. These are estimates,
not guarantees.

## Cancelling and returns

You have a 14-day right of withdrawal. See the [returns and refunds](/returns)
page for how it works.

## Complaints

Write to ${TRADER.email}. [Add any alternative dispute-resolution body you
are required to name.]

## Governing law

These terms are governed by Bulgarian law. Nothing here limits your statutory
rights as a consumer.`,
    bg: `${TODO_BG}

## От кого купувате

${TRADER.nameBg}, ${TRADER.addressBg}.
Имейл: ${TRADER.email}.
ЕИК: [ЕИК]. [ДДС номер — посочете го или отбележете, че дружеството не е
регистрирано по ЗДДС.]

## Продуктите

Оригинални принтове, линогравюри и аксесоари, изработени и продавани от
художника. Всяка обява посочва техника, размери и година. Тъй като творбите са
ръчно изработени, малки разлики между снимката и получения артикул са нормални.

## Цени и доставка

Всички цени са в евро и [включват ДДС / не подлежат на ДДС]. Доставката се
начислява допълнително и се показва преди плащане — сумата, която потвърждавате,
е сумата, която заплащате. Няма скрити добавки.

## Поръчка

Избирането на начин на доставка и завършването на плащането представлява
обвързваща поръчка. Ще получите потвърждение по имейл. Плащането се обработва от
Stripe; магазинът не вижда и не съхранява данните на картата ви.

## Доставка

Поръчките се изпращат в рамките на [N] работни дни. Доставката в България
обикновено отнема [N] работни дни, а в останалата част от ЕС — [N]. Това са
ориентировъчни срокове.

## Отказ и връщане

Имате право на отказ в 14-дневен срок. Вижте страницата
[връщане и възстановяване](/returns).

## Рекламации

Пишете на ${TRADER.email}. [Добавете орган за алтернативно решаване на спорове,
ако се изисква.]

## Приложимо право

Приложимо е българското право. Нищо в тези условия не ограничава законовите ви
права като потребител.`,
  },

  privacy: {
    en: `${TODO_EN}

## Who is responsible

${TRADER.nameEn}, ${TRADER.addressEn}. Email: ${TRADER.email}.

## What is collected, and why

**When you order:** your name, email, shipping address and phone number. These
are needed to take payment and send your parcel — the legal basis is performing
the contract between us.

**When you browse:** this site runs its own analytics. It sets **no cookies**
and stores no IP address. To count visitors once per day it stores a one-way
hash of your IP address, browser and the current date, which cannot be reversed
and is useless tomorrow. It also records which page was viewed, how long it was
open, your referring website's domain, your device type and your language. None
of this identifies you or follows you to other sites.

## Who else processes your data

- **Stripe** — payment, and the address you enter at checkout. Card details go
  to Stripe directly and never reach this site.
- **Resend** — sends your order confirmation email.
- **MongoDB Atlas** — stores orders.
- **Cloudinary** — stores and serves the artwork images.

Each acts as a processor under contract. [Confirm the hosting regions you are
comfortable disclosing.]

## How long it is kept

Order records are kept for [N] years, as accounting rules require. Analytics
records are kept for [N] months.

## Your rights

You can ask for a copy of your data, its correction, or its deletion, and you
can object to processing. Write to ${TRADER.email}. You may also complain to the
Bulgarian Commission for Personal Data Protection.`,
    bg: `${TODO_BG}

## Кой отговаря за данните

${TRADER.nameBg}, ${TRADER.addressBg}. Имейл: ${TRADER.email}.

## Какви данни се събират и защо

**При поръчка:** име, имейл, адрес за доставка и телефон. Те са необходими за
обработка на плащането и изпращане на пратката — основанието е изпълнение на
договора между нас.

**При разглеждане:** сайтът използва собствена статистика. Той **не поставя
бисквитки** и не съхранява IP адреси. За да отчете посетител веднъж дневно,
записва необратим хеш от вашия IP адрес, браузър и текущата дата, който не може
да бъде разшифрован и е безполезен на следващия ден. Записват се още
разгледаната страница, времето върху нея, домейнът на препращащия сайт, типът
устройство и езикът. Тези данни не ви идентифицират и не ви проследяват в други
сайтове.

## Кой друг обработва данните

- **Stripe** — плащането и адресът, въведен при плащане. Данните на картата
  отиват директно към Stripe и никога не достигат този сайт.
- **Resend** — изпраща имейла с потвърждение на поръчката.
- **MongoDB Atlas** — съхранява поръчките.
- **Cloudinary** — съхранява и доставя изображенията на творбите.

Всеки действа като обработващ по договор.

## Срок на съхранение

Данните за поръчки се пазят [N] години съгласно счетоводните изисквания.
Статистическите записи се пазят [N] месеца.

## Вашите права

Можете да поискате копие от данните си, тяхната корекция или изтриване, както и
да възразите срещу обработването. Пишете на ${TRADER.email}. Имате право и на
жалба до
Комисията за защита на личните данни.`,
  },

  returns: {
    en: `${TODO_EN}

## Your 14-day right to change your mind

You may withdraw from your purchase within **14 days** of receiving it, without
giving a reason. The period ends 14 days after the day the parcel reaches you.

## How to withdraw

Email ${TRADER.email} with your order number and say you are withdrawing. A clear
statement is enough — no form is required. Then send the item back within 14
days of telling us.

## Condition

Please return the work unused and in its original packaging, protected the way
it arrived. Prints are fragile; a creased or marked return may reduce the refund
by the loss in value.

## Who pays the postage

The original delivery charge is refunded. The cost of sending the item back is
[yours / mine] — [state which, and the return address].

## Your refund

Once the item is back and checked, the refund is made within **14 days**, to the
same payment method. [Note anything about exchanges, if you offer them.]

## Return address

${TRADER.nameEn}, ${TRADER.addressEn}.

## Exceptions

Items made to your specification or clearly personalised — a commission — are
excluded from the right of withdrawal. [Remove this section if you take no
commissions.]`,
    bg: `${TODO_BG}

## Право на отказ в 14-дневен срок

Имате право да се откажете от покупката в срок от **14 дни** от получаването ѝ,
без да посочвате причина. Срокът изтича 14 дни след деня, в който сте получили
пратката.

## Как да упражните отказа

Изпратете имейл на ${TRADER.email} с номера на поръчката и заявете, че се
отказвате.
Достатъчно е ясно изявление — не е нужен формуляр. След това върнете артикула в
срок от 14 дни от уведомяването.

## Състояние на артикула

Моля, върнете творбата неизползвана и в оригиналната ѝ опаковка, защитена както
е пристигнала. Принтовете са чупливи; при намачкване или замърсяване
възстановената сума може да бъде намалена със загубата на стойност.

## Кой плаща доставката

Първоначалната такса за доставка се възстановява. Разходите за връщане са
[за ваша сметка / за моя сметка] — [посочете кой и адреса за връщане].

## Възстановяване на сумата

След като артикулът бъде получен и проверен, сумата се възстановява в срок от
**14 дни** по същия начин на плащане.

## Адрес за връщане

${TRADER.nameBg}, ${TRADER.addressBg}.

## Изключения

Артикули, изработени по ваша заявка или явно персонализирани — индивидуална
поръчка — са изключени от правото на отказ.`,
  },
};
