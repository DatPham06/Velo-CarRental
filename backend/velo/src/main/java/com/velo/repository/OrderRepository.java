package com.velo.repository;

import com.velo.entity.OrderEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Date;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @Query("""
            select count(detail) from OrderDetailEntity detail
            where detail.car.id in :carIds
              and upper(detail.order.status) not in ('CANCELLED', 'CANCELED', 'RETURNED', 'COMPLETED')
              and detail.order.startDate < :expireDate
              and detail.order.expireDate > :startDate
            """)
    long countOverlappingRentals(@Param("carIds") List<Long> carIds,
                                @Param("startDate") Date startDate,
                                @Param("expireDate") Date expireDate);
    List<OrderEntity> findAllByOrderByIdDesc();

    @Query("""
            select count(detail) from OrderDetailEntity detail
            where detail.car.id in :ids and upper(detail.order.status) = 'RENTING'
            """)
    long countCarsOutOnRental(@Param("ids") List<Long> ids);

    @EntityGraph(attributePaths = "account")
    @Query("""
            select o from OrderEntity o
            where (:accountId is null or o.account.id = :accountId)
              and (:allStatuses = true or upper(o.status) in :statuses)
            order by o.id desc
            """)
    Page<OrderEntity> listOrders(@Param("accountId") Long accountId, @Param("allStatuses") boolean allStatuses,
                                 @Param("statuses") List<String> statuses, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OrderEntity o where o.id = :id")
    Optional<OrderEntity> findForUpdate(@Param("id") Long id);
}
