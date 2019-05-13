function AJAXprovider()
{
	/**
	 * Выслать запрос
	 * @param url - адрес, по которому нужно отправить запрос
	 * @param param - необязательный аргумент, содержащий параметры для POST запроса
	 * @param async - async (TRUE/FALSE)
	 * @returns {XMLHttpRequest}
	 */
	this.postRequest = function (url, param, async)
	{
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, async);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('Cache-Control', 'post-check=0,pre-check=0, false');
		xhr.setRequestHeader('Cache-Control',  'max-age=0, false');
		xhr.setRequestHeader('Pragma', 'no-cache');
		xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
		xhr.send(param);
		return xhr;
	};
}