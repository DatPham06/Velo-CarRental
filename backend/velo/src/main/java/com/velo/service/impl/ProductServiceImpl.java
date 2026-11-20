package com.velo.service.impl;

import com.velo.entity.ProductEntity;
import com.velo.repository.ProductRepository;
import com.velo.service.ProductService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public ProductEntity createProduct(ProductEntity productEntity) {
        validateProduct(productEntity);
        productEntity.setId(null);
        productEntity.setStatus("AVAILABLE");
        return productRepository.save(productEntity);
    }

    @Override
    public List<ProductEntity> findAllProduct() {
        return productRepository.findAll();
    }

    @Override
    public List<ProductEntity> findVisibleForRental() {
        return productRepository.findVisibleForRental();
    }

    @Override
    public List<ProductEntity> findAllByBrand(String Brand) {
        return productRepository.findAllByBrand(Brand);
    }

    @Override
    public ProductEntity findById(long id) {
        ProductEntity product = productRepository.findById(id);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe.");
        }
        return product;
    }

    @Override
    @Transactional
    public ProductEntity updateProduct(long id, ProductEntity product) {
        validateProduct(product);
        ProductEntity existing = productForUpdate(id);
        existing.setProductName(product.getProductName());
        existing.setBrand(product.getBrand());
        existing.setPricePerDay(product.getPricePerDay());
        existing.setIMG(product.getIMG());
        return productRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteProduct(long id) {
        ProductEntity product = productForUpdate(id);
        try {
            productRepository.delete(product);
            productRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã có đơn thuê, không thể xóa.");
        }
    }

    private ProductEntity productForUpdate(long id) {
        // Dùng cùng khóa với luồng đặt thuê để tránh xóa/sửa đồng thời khi đang tạo đơn.
        return productRepository.findAllForRental(List.of(id)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe."));
    }

    private void validateProduct(ProductEntity product) {
        if (product.getProductName() == null || product.getProductName().isBlank()
                || product.getProductName().length() > 255
                || product.getBrand() == null || product.getBrand().isBlank() || product.getBrand().length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên xe và hãng xe phải có từ 1 đến 255 ký tự.");
        }
        BigDecimal price = product.getPricePerDay();
        if (price == null || price.signum() <= 0 || price.stripTrailingZeros().scale() > 2
                || price.precision() - price.scale() > 36) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá thuê phải lớn hơn 0, tối đa 2 chữ số thập phân.");
        }
        String image = product.getIMG();
        if (image != null && (image.length() > 255 || (!image.isBlank()
                && !image.startsWith("/images/") && !image.startsWith("https://") && !image.startsWith("http://")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đường dẫn ảnh không hợp lệ.");
        }
        product.setProductName(product.getProductName().trim());
        product.setBrand(product.getBrand().trim());
        product.setIMG(image == null || image.isBlank() ? null : image.trim());
    }

}
