package com.velo.repository;

import com.velo.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    @Query("""
            select car from ProductEntity car
            where not exists (
                select detail.id from OrderDetailEntity detail
                where detail.car.id = car.id and upper(detail.order.status) = 'PENDING'
            )
            order by car.id
            """)
    List<ProductEntity> findVisibleForRental();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select car from ProductEntity car where car.id in :ids order by car.id")
    List<ProductEntity> findAllForRental(@Param("ids") List<Long> ids);
    List<ProductEntity> findAllByBrand(String Brand);
    ProductEntity findById(long id);

}
