# Полифил для ES6 Promise

Работа выполнена в качестве домашнего задания по теме JS школы разработки интерфейсов 2019.

**ВНИМАНИЕ! НЕ ДЛЯ ИСПОЛЬЗОВАНИЯ В РЕАЛЬНОМ ПРОЕКТЕ!!**

Код полифила выполнен в одном файле (index.js).
Не используются инструменты для сборки и ES6 возможности языка.
Реализована обработка *thenable* объектов.

Полифил выполнен согласно всем стандартам [Promises/A+](https://promisesaplus.com/). Проходит все 872 теста [Promises/A+ Compliance Test Suite](https://github.com/promises-aplus/promises-tests).

При отсутствии нативного `Promise` в браузере (например IE), полифил при подключении прозрачно реализует весь функционал. В браузерах где присутствует поддержка промисов подмены стандартного объекта `Promise` не происходит. Если необходимо обратиться непосредственно к функционалу полифила, то он всегда доступен по альясу `PPromise` .

## Пример использования полифила

	const  promise  =  PPromise.resolve(11)

	promise
		.then((num)  =>  num  +  1)
		.then((num)  =>  {
			console.log(num) // 12
			return  new  PPromise((resolve)  =>  {
				setTimeout(()  =>  {
					resolve(num  *  2)
				},  500)
			})
		})
		.then((num)  =>  {
			console.log(num) // 24 (after 500ms)
			throw  num  +  1
		})
		.then((num)  =>  {
			console.log('Not appeared') // Not will be displayed
		})
		.catch((num)  =>  {
			console.log('Thrown number',num ) // 25
		})

## Отличия в работе от нативного Promise

- При логировании промиса в консоль не отображается значение и состояние, которое в данный момент содержит промис;
- Необработанные исключения внутри промиса не выбрасывают сообщения об ошибке за его пределы. (Реализовано поведение согласно *DEP0018*);

Пример вызова ошибки из нативного промиса в REPL NodeJS (v12.10.0):

	> Promise.reject('ERROR')
	Promise { <rejected> 'ERROR' }
	> (node:20958) UnhandledPromiseRejectionWarning: ERROR
	(node:20958) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
	(node:20958) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

вызов ошибки из полифила:

	> Promise.reject('ERROR')
	Promise { then: [Function], catch: [Function] }
	>

## Тесты

Для установки зависимостей необходимых для запуска тестов выполните команду `yarn`
Для запуска тестов `yarn test` .
Результаты прохождения Promises/A+ тестов отображаются в консоли, а также генерируется HTML отчет в папке `mochawesome-report` в корне проекта.