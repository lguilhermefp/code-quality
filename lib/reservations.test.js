const Reservation = require('./schema/reservation');

describe('fetch', () => {
	let reservations;

	beforeAll(() => {
		jest.mock('./reservations')
		reservations = require('./reservations');
	});

	afterAll(() => {
		jest.unmock('./reservations');
	});

	it('should be mocked and not create a database recorde', () => {
		expect(reservations.fetch()).toBeUndefined();
	});
});


describe('save', () => {
  let reservations;
  const mockDebug = jest.fn();
  const mockInsert = jest.fn().mockResolvedValue([1]);

  beforeAll(() => {
    jest.mock('debug', () => () => mockDebug);
    jest.mock('./knex', () => () => ({
      insert: mockInsert,
    }));
    reservations = require('./reservations');
  });

  afterAll(() => {
    jest.unmock('debug');
    jest.unmock('./knex');
  });

  it('should resolve with the id upon successful validation', async () => {
    const insertedValue = { foo: 'bar' }
    const expectedResolvedValue = [1];
    const actualResolvedValue = await reservations.save(insertedValue);
    expect(actualResolvedValue).toStrictEqual(expectedResolvedValue);
    expect(mockDebug).toBeCalledTimes(1);
    expect(mockInsert).toBeCalledWith(insertedValue);
  });
});

describe('validate', () => {
	let reservations;

	beforeAll(() => {
		reservations = require('./reservations');
	});

	it('should resolve with no optional fields', async () => {
		const reservation = new Reservation({
			date: '2017/06/10',
			time: '06:02 AM',
			party: 4,
			name: 'Family',
			email: 'usename@example.com'
		});

		await expect(reservations.validate(reservation))
			.resolves.toEqual(reservation);
	});

	it('should reject with an invalid email', async () => {
		const reservation = new Reservation({
			date: '2017/06/10',
			time: '06:02 AM',
			party: 4,
			name: 'Family',
			email: 'username',
		});

		await expect(reservations.validate(reservation))
			.rejects.toBeInstanceOf(Error);
	});

	it('should be called and reject empty input', async () => {
		const mock = jest.spyOn(reservations, 'validate');
		const value = undefined;
		await expect(reservations.validate(value))
			.rejects.toThrow('Cannot read property \'validate\' of undefined');

		expect(mock).toBeCalledWith(value);
		mock.mockRestore();
	});
});

describe('create', () => {
	let reservations;

	it('should create reservation upon successful validation', async () => {
		const expectedInsertedId = 1;
		// const mockInsert = jest.fn().mockResolvedValue([expectedInsertId]);
		// jest.mock('./knex', () => () => ({
		// 	insert: mockInsert,
		// }));
		reservations = require('./reservations');
		mockValidation = jest.spyOn(reservations, 'validate');

		mockValidation.mockImplementation(value => Promise.resolve(value));
		const reservation = {foo: 'bar'}

		await expect(reservations.create(reservation))
			.resolves.toStrictEqual(expectedInsertedId);

		expect(reservations.validate).toHaveBeenCalledTimes(1);
		expect(mockValidation).toBeCalledWith(reservation);
		expect(mockValidation).toBeCalledTimes(1);

		// jest.unmock('./knex');
		mockValidation.mockRestore();
	});

	it('should reject if validation fails', async () => {
		reservations = require('./reservations');
		const originalFn = reservations.validate;
		const error = new Error('fail');
		reservations.validate = jest.fn(() => Promise.reject(error))

		await expect(reservations.create())
			.rejects.toBe(error);

		expect(reservations.validate).toBeCalledTimes(1);

		reservations.validate = originalFn;
	});

	it('should reject if validation fails using spyOn', async () => {
		reservations = require('./reservations');
		const mock = jest.spyOn(reservations, 'validate');
		const error = new Error('fails');
		const value = 'puppy';
		mock.mockImplementation(() => Promise.reject(error));
		await expect(reservations.create(value)).rejects.toEqual(error);

		expect(mock).toHaveBeenCalledTimes(1);
		expect(mock).toHaveBeenCalledWith(value);

		mock.mockRestore();
	});
});
