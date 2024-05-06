import {removeFromSubtypesCache} from './data/redis.js';
import {fetchPathsToRoot, convertToInt} from './data/db.js';
import {remFact} from './dbOperations.js';
import {Fact} from './types.js';

const deleteOneFact = async (fact: Fact) => {
	if (!fact) {
		console.log('No fact to delete');
		return;
	}
	if (fact.rel_type_uid === 1146) {
		//or some subtype thereof
		try {
			const paths = await fetchPathsToRoot(fact.lh_object_uid);
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
				removeFromSubtypesCache(entityUID, fact.lh_object_uid);
			});
		} catch (error) {
			console.error('An error occurred:', error);
		}
	}

	try {
		await remFact(fact.fact_uid);
		console.log('Done');
	} catch (error) {
		console.error('An error occurred:', error);
	}
};

export default deleteOneFact;
