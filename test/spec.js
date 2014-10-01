describe("Hitbox Object", function() {
    it("Should Create Hitbox Object", function() {
        var hitbox = new Hitbox();
        expect(hitbox.get('home_router')).toBe('http://api.hitbox.tv');
    });

    it("Should change home_router", function() {
        var hitbox = new Hitbox();
        hitbox.set({home_router: 'test_router'});
        expect(hitbox.get('home_router')).toBe('test_router');
    });
});

describe("Hitbox support functions", function () {
	it("Should create url without query params", function () {
        var hitbox = new Hitbox();
        expect(hitbox._create_url({uri: 'test/url'})).toBe('http://api.hitbox.tv/test/url');
	});

	it("Should create url with query params", function () {
        var hitbox = new Hitbox();
        expect(hitbox._create_url({uri: 'test/url', query_params:{'a':1, 'b':2}})).toBe('http://api.hitbox.tv/test/url&a=1&b=2');
	});

	it("Should change the backend and build new urls on that change", function () {
        var hitbox = new Hitbox();
        hitbox.set({home_router: 'https://test_router'});
        expect(hitbox._create_url({uri: 'test/url', query_params:{'a':1, 'b':2}})).toBe('https://test_router/test/url&a=1&b=2');
	});
});

describe("Hitbox endpoint tests", function () {
	var server;
 
	beforeEach(function() {
		server = sinon.fakeServer.create();
	});

	afterEach(function () {
		server.restore();
	});

	it("Should hit media endpoint and return list of media elements", function () {
        var hitbox = new Hitbox();
        server.respondWith("GET", "http://api.hitbox.tv/media/", [200, { "Content-Type": "application/json" },'{}']);
        var callbacks = [sinon.spy()];

        hitbox.media(undefined, undefined, function (error, response) {
			expect(error).toBeFalsy();
			expect(response).toEqual({});
        });

        server.respond();
	});

	it("Should hit media endpoint with a stream and return a specific media stream", function () {
        var hitbox = new Hitbox();
        server.respondWith("GET", "http://api.hitbox.tv/media/", [200, { "Content-Type": "application/json" },'{}']);
        var callbacks = [sinon.spy()];

        hitbox.media(undefined, undefined, function (error, response) {
			expect(error).toBeFalsy();
			expect(response).toEqual({});
        });

        server.respond();
	});
});

describe("Hitbox websocket tests", function () {

});