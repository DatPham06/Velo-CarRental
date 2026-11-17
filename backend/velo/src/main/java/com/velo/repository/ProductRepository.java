package com.velo.repository;

import com.velo.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    List<ProductEntity> findAllByBrand(String Brand);
    ProductEntity findById(long id);

}
