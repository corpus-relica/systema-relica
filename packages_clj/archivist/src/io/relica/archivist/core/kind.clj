(ns io.relica.archivist.core.kind
  (:require [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.graph-service :as graph])
  (:import (java.net URI))
  (:gen-class))

(defn serialize-record [record]
  (reduce-kv (fn [m k v]
               (assoc m k
                     (cond
                       (instance? java.time.LocalDate v) (.toString v)
                       :else v)))
             {}
             record))

(defn get-list [conf]
  (try
    (let [resolved-conf {:sortField (first (:sort conf))
                         :sortOrder (second (:sort conf))
                         :skip (first (:range conf))
                         :pageSize (second (:range conf))}
          _ (tap> resolved-conf)
          raw-result (graph/exec-query
                      graph/graph-service
                      queries/get-lists-of-kinds
                      resolved-conf)
          result (map (fn [record]
                        (serialize-record (:r record)))
                      raw-result)
          total (graph/exec-query
                 graph/graph-service
                 queries/count-kinds
                 {})]
      {:data result
       :total (:total (first total))}
      )
    (catch Exception e
      (tap> {:event :get-kinds-list-error
             :error e})
      nil)))


(comment

  )

  ;; constructor(private readonly graphService: GraphService) {}

  ;; async getList(
  ;;   sortField: string,
  ;;   sortOrder: string,
  ;;   skip: number,
  ;;   pageSize: number,
  ;; ) {
  ;;   const result = await this.graphService.execQuery(getListOfKindsQuery, {
  ;;     sortField,
  ;;     sortOrder,
  ;;     skip: neo4j.int(skip),
  ;;     pageSize: neo4j.int(pageSize),
  ;;   });

  ;;   const total = await this.graphService.execQuery(countKindsQuery, {});

  ;;   const transformedResult = result.map((item) => {
  ;;     const t: any = this.graphService.transformResult(item);
  ;;     t.id = t.fact_uid;
  ;;     return t;
  ;;   });

  ;;   //convert neo4j integer to js number
  ;;   console.log();

  ;;   return {
  ;;     data: transformedResult,
  ;;     total: total[0].get('total').toInt(),
  ;;   };
  ;; }

  ;; async getOne(id: number) {
  ;;   return {};
  ;; }

  ;; async getMany(data: any) {}

  ;; async getManyReference(data: any) {}

  ;; async create(data: any) {}

  ;; async update(id: number, data: any) {}

  ;; async updateMany(data: any) {}

  ;; async delete(id: number) {}

  ;; async deleteMany(data: any) {}
