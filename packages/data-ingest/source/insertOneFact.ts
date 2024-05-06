import {
	// getMinFreeEntityUID,
	// getMinFreeFactUID,
	// setMinFreeEntityUID,
	// setMinFreeFactUID,
	addToSubtypesCache,
} from './data/redis.js';
import {fetchPathsToRoot, convertToInt} from './data/db.js';
import {addFact} from './dbOperations.js';
import {Fact} from './types.js';

// const resolveUIDs = async (fact: Fact): Promise<Fact> => {
// 	const minFreeEntityUID = await getMinFreeEntityUID();
// 	const minFreeFactUID = await getMinFreeFactUID();

// 	await setMinFreeEntityUID(minFreeEntityUID + 1);
// 	await setMinFreeFactUID(minFreeFactUID + 1);

// 	return Object.assign({}, fact, {
// 		fact_uid: minFreeFactUID,
// 		lh_object_uid: minFreeEntityUID,
// 	});
// };

const insertOneFact = async (f: Fact) => {
	const resolvedFact: Fact = f; //await resolveUIDs(f);
	await addFact(resolvedFact);

	if (resolvedFact.rel_type_uid === 1146) {
		// or some subtype thereof
		try {
			const paths = await fetchPathsToRoot(resolvedFact.lh_object_uid);
			const entitiesToUpdate = new Set();
			paths.forEach(path => {
				path.segments.forEach((segment: any) => {
					if (segment.start.labels.includes('Fact')) {
						entitiesToUpdate.add(
							convertToInt(segment.start.properties.lh_object_uid),
						);
						entitiesToUpdate.add(
							convertToInt(segment.start.properties.rh_object_uid),
						);
					}
					if (segment.end.labels.includes('Fact')) {
						entitiesToUpdate.add(
							convertToInt(segment.end.properties.lh_object_uid),
						);
						entitiesToUpdate.add(
							convertToInt(segment.end.properties.rh_object_uid),
						);
					}
				});
			});
			// console.log('entitiesToUpdate', entitiesToUpdate.values());
			Array.from(entitiesToUpdate).forEach((entityUID: any) => {
				// console.log('entityUID', entityUID);
				addToSubtypesCache(entityUID, resolvedFact.lh_object_uid);
			});
		} catch (error) {
			console.error('An error occurred:', error);
		}
	}
};

export default insertOneFact;
